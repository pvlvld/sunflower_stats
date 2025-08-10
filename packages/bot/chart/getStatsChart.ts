import type { IAllowedChartStatsRanges } from "../commands/stats_chat.js";
import { ChartCanvasManager } from "./chartCanvas.js";
import type { Chart } from "chart.js";
import { DBPoolManager } from "../db/poolManager.js";
import chartJs from "chart.js/auto";
import { InputFile } from "grammy";
import { Canvas, type Image, loadImage } from "canvas";
import fs from "node:fs";
import { getChartConfig, IChartConfiguration } from "./utils/getChartConfig.js";
import { getChartData } from "./utils/getChartData.js";
import { downloadAvatar } from "./utils/downloadAvatar.js";
import bot from "../bot.js";
import cfg from "../config.js";
import { overlayChartOnVideo } from "./utils/overlayChartOnVideo.js";
import { RabbitMQClient } from "@sunflower-stats/shared";
import cacheManager from "../cache/cache.js";
import { IChartCache } from "../cache/chartCache_User.js";
import { IChartResult, IChartStatsTask } from "@sunflower-stats/shared/types/types.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { DefaultChartSettings, IChartSettings } from "../db/chartSettings.js";
import { Database } from "../db/db.js";
import { IChatSettings } from "../consts/defaultChatSettings.js";
import { IGroupContext, IGroupHearsCommandContext } from "../types/context.js";
import { isPremium } from "../utils/isPremium.js";
import { ConsumeMessage } from "amqplib";
import formattedDate from "../utils/date.js";

export type IChartType = "user" | "chat";
export type IChartFormat = "video" | "image";

interface SQLQueryResult {
    month: string;
    chat_id: number;
    title: string;
    total_messages: number;
    rank: number;
}

interface BumpChartDataPoint {
    x: string;
    y: number;
    chat_id: number; // Chat pic
}

interface BumpChartSeries {
    label: string;
    chat_id: number; // Chat pic
    data: BumpChartDataPoint[];
}

/**Rerutns @InputFile success @undefined stats contain less than 7 records*/
export async function getStatsChart(
    chat_id: number,
    user_id: number,
    type: IChartType,
    rawDateRange?: IAllowedChartStatsRanges
): Promise<{ chart: InputFile; chartFormat: IChartFormat } | undefined> {
    let data: any[];
    const targetId = type === "user" ? user_id : chat_id;

    if (type === "user") {
        data = await getChartData.userInChat(chat_id, user_id);
    } else if (type === "chat") {
        if (rawDateRange) {
            data = await getChartData.chatInChat(chat_id, rawDateRange);
        } else {
            data = await getChartData.chatInChat(chat_id, "all");
        }
    } else if (type === "bot-all") {
        data = (
            await DBPoolManager.getPoolRead.query(
                `SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
                    FROM stats_daily
                    WHERE date > CURRENT_DATE - INTERVAL '1 year' 
                      AND date < CURRENT_DATE
                    GROUP BY date
                    ORDER BY date;`
            )
        ).rows;
    } else {
        throw new Error("Invalid chart type");
    }

    // Do we steel need this?
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig.default(chat_id, user_id, type);
    configuration.data.datasets[0].data = data;
    configuration.data.labels = data.map((v) => v["x"]);

    if (configuration.custom.transparent) {
        return {
            chart: new InputFile(
                await overlayChartOnVideo(await renderToBuffer(configuration), targetId, chat_id),
                "chart.mp4"
            ),
            chartFormat: "video",
        };
    } else {
        return {
            chart: new InputFile(await renderToBuffer(configuration), "chart.jpg"),
            chartFormat: "image",
        };
    }
}

export class StatsChartManager {
    private static instance: StatsChartManager;
    public STATS_COMMANDS = Object.freeze({
        user: ["!я", "йа", "/me", "/i", "/you", "!ти", "/u"],
        chat: ["!стата", "!статистика", "стата", "статистика", "/stats"],
        otherUser: ["!ти", "/you", "/u"],
    });
    private pendingCharts: Map<string, unknown> = new Map();

    private constructor(
        private rabbitMQClient: RabbitMQClient = RabbitMQClient.getInstance(),
        private cache = { chat: cacheManager.ChartCache_Chat, user: cacheManager.ChartCache_User }
    ) {
        this.rabbitMQClient
            .assertQueue("chart_results", {
                durable: true,
                autoDelete: false,
                maxPriority: 1,
            })
            .then(() => {
                console.log("Chart results queue initialized");
            });
        this.rabbitMQClient
            .assertQueue("chart_stats_tasks", {
                durable: true,
                autoDelete: false,
                maxPriority: 1,
            })
            .then(() => {
                console.log("Chart stats tasks queue initialized");
            });
        this.initChartConsumer();
    }

    public getInstance(): StatsChartManager {
        if (!StatsChartManager.instance) {
            StatsChartManager.instance = new StatsChartManager();
        }
        return StatsChartManager.instance;
    }

    public async requestStatsChart(
        ctx: IGroupHearsCommandContext,
        type: IChartType,
        rawDateRange?: IAllowedChartStatsRanges
    ) {
        const user_id = ctx.from.id;
        const chat_id = ctx.chat.id;
        const target_id = type === "user" ? user_id : chat_id;
        const task_id = `${chat_id}:${target_id}`;
        rawDateRange ??= "all";

        if (this.pendingCharts.has(task_id)) {
            return;
        } else {
            this.pendingCharts.set(task_id, {});
        }
        // const cachedChart = this.getCachedChart(chat_id, user_id, type, rawDateRange);

        // if (cachedChart.status === "ok") {
        //     return {
        //         chart: new InputFile(cachedChart.file_id, "Соняшник_Статистика"),
        //         chartFormat: cachedChart.chartFormat,
        //     };
        // }

        try {
            const [chartSettings, chat_premium, user_premium] = await Promise.all([
                this.getChartSettings(chat_id, user_id, type),
                isPremium(chat_id),
                isPremium(user_id),
            ]);
            const date = formattedDate[rawDateRange];

            this.rabbitMQClient.produce<"chart_stats_tasks">(
                "chart_stats_tasks",
                {
                    task_id,
                    chat_id,
                    user_id,
                    target_id,
                    font_color: chartSettings.font_color,
                    line_color: chartSettings.line_color,
                    usechatbgforall: chartSettings.usechatbgforall,
                    reply_to_message_id: ctx.msg.message_id,
                    thread_id: ctx.msg.message_thread_id || 0,
                    date_from: date[0],
                    date_until: date[1],
                    chat_premium,
                    user_premium,
                },
                {
                    priority: +(chat_premium || user_premium),
                }
            );
        } catch (error) {
            console.error("Error requesting stats chart:", error);
            this.pendingCharts.delete(task_id);
        }

        return undefined;
    }

    private async getChartSettings(
        chat_id: number,
        user_id: number,
        type: IChartType
    ): Promise<IChartSettings & Pick<IChatSettings, "usechatbgforall">> {
        const [chatSettings, userSettings] = await Promise.all([
            getCachedOrDBChatSettings(chat_id),
            Database.user.settings.get(user_id),
        ]);

        const settings = {
            line_color: userSettings.line_color,
            font_color: userSettings.font_color,
            usechatbgforall: chatSettings.usechatbgforall,
        };

        if (settings.usechatbgforall || type === "chat") {
            settings.line_color = chatSettings.line_color;
            settings.font_color = chatSettings.font_color;
        }

        return settings;
    }

    private initChartConsumer() {
        this.rabbitMQClient.consume<"chart_results">("chart_results", this.chartConsumer.bind(this));

        console.log("Chart consumer initialized");
    }

    private chartConsumer(res: IChartResult, msg: ConsumeMessage | null) {
        //
    }

    public handleCommand(ctx: IGroupHearsCommandContext) {
        const parts = (ctx.msg.text || ctx.msg.caption)!.split(" ");

        if (this.STATS_COMMANDS.user.includes(parts[0].toLowerCase())) {
            //
        }

        if (this.STATS_COMMANDS.chat.includes(parts[0].toLowerCase())) {
            //
        }
    }

    private getCachedChart(
        chat_id: number,
        user_id: number,
        type: IChartType,
        rawDateRange?: IAllowedChartStatsRanges
    ): IChartCache {
        return type === "chat"
            ? this.cache.chat.get(chat_id, rawDateRange || "all")
            : this.cache.user.get(chat_id, user_id);
    }
}

async function getChatImage(chat_id: number): Promise<Image> {
    // If bot is not the main bot, return default image
    if (bot.botInfo.id != cfg.MAIN_BOT_ID) {
        return await loadImage(`./data/profileImages/!default.jpg`);
    }
    // Load image from disk
    if (fs.existsSync(`./data/profileImages/${chat_id}.jpg`)) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    }
    // dont parallelized to avoid angering the telegram api
    const isDownloaded = await downloadAvatar.chat(chat_id);
    if (isDownloaded) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    } else {
        return await loadImage(`./data/profileImages/!default.jpg`);
    }
}

async function preloadChatImages(chatIds: number[]) {
    const imageMap = new Map<number, Image>();

    for (const chatId of chatIds) {
        try {
            const image = await getChatImage(chatId);
            imageMap.set(chatId, image);
        } catch (error) {
            console.error(`Failed to load image for chat_id: ${chatId}`, error);
        }
    }

    return imageMap;
}

function createProfileImagesPlugin(imageMap: Map<number, Image>) {
    return {
        id: "profileImages",
        afterDatasetsDraw(chart: any, args: any, options: any) {
            const { ctx } = chart;
            const imageSize = 72;

            let x = 0.0;
            let y = 0.0;

            for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
                const dataset = chart.data.datasets[datasetIndex];
                const chat_id = dataset.chat_id;
                const meta = chart.getDatasetMeta(datasetIndex);

                if (!imageMap.has(chat_id)) continue;

                const chatImage = imageMap.get(chat_id);

                for (let idx in meta.data) {
                    // don't draw images for data points with y > 10
                    if (dataset.data[idx].y === undefined || dataset.data[idx].y > 10) continue;
                    ({ x, y } = meta.data[idx].getCenterPoint());
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, imageSize / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(chatImage, x - imageSize / 2, y - imageSize / 2, imageSize, imageSize);
                    ctx.restore();
                }
            }
        },
    };
}

function prepareBumpChartData(sqlResults: SQLQueryResult[]): BumpChartSeries[] {
    // Group data by chat_id/title
    const chatGroups = new Map<
        number,
        {
            title: string;
            dataPoints: Map<string, number>;
        }
    >();

    // Get all unique months
    const months = new Set<string>();

    sqlResults.forEach((row) => {
        const date = new Date(row.month);
        // TODO: localizations
        const monthStr = date.toLocaleDateString("uk-UA", {
            year: "numeric",
            month: "short",
        });
        months.add(monthStr);

        if (!chatGroups.has(row.chat_id)) {
            chatGroups.set(row.chat_id, {
                title: row.title,
                dataPoints: new Map(),
            });
        }

        chatGroups.get(row.chat_id)!.dataPoints.set(monthStr, row.rank);
    });

    // Convert to array and sort chronologically
    const sortedMonths = Array.from(months).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
    });

    const series: BumpChartSeries[] = [];

    chatGroups.forEach((groupData, chat_id) => {
        months;
        const data: BumpChartDataPoint[] = sortedMonths.map((month) => ({
            x: month,
            // fetch ~15, show 10, set 16 for 11th+ place to make chart less "fake" looking
            y: groupData.dataPoints.get(month) || 16,
            chat_id: chat_id,
        }));

        series.push({
            label: groupData.title,
            chat_id: chat_id,
            data: data,
        });
    });

    return series;
}

async function getChartTopChatsMonthly(data: any) {
    const config = getChartConfig.topChatsMonthly(10);
    config.data.datasets = prepareBumpChartData(data) as any; // FIX:
    config.plugins!.push(
        createProfileImagesPlugin(
            await preloadChatImages([
                ...new Set(config.data.datasets.map((dataset: any) => dataset.chat_id)),
            ] as number[])
        )
    );
    return new InputFile(await renderToBufferX2(config), "chart.jpg");
}

async function getStatsChartFromData(
    chat_id: number,
    user_id: number,
    type: IChartType,
    data: { x: string; y: number }[]
): Promise<{ chart: InputFile; chartFormat: IChartFormat } | undefined> {
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig.default(chat_id, user_id, type);
    configuration.data.datasets[0].data = data as any;
    configuration.data.labels = data.map((v) => v["x"]);

    if (configuration.custom.transparent) {
        return {
            chart: new InputFile(
                await overlayChartOnVideo(
                    await renderToBuffer(configuration),
                    type === "chat" ? chat_id : user_id,
                    chat_id
                ),
                "chart.mp4"
            ),
            chartFormat: "video",
        };
    } else {
        return {
            chart: new InputFile(await renderToBuffer(configuration), "chart.jpg"),
            chartFormat: "image",
        };
    }
}

function renderToBuffer(configuration: IChartConfiguration) {
    const canvas = ChartCanvasManager.get; // 0ms
    const chart = new chartJs(canvas, configuration); // 50-70ms
    let buffer;
    if (configuration.custom?.transparent) {
        buffer = chart.canvas.toBuffer("image/png", { compressionLevel: 0, filters: Canvas.PNG_NO_FILTERS }); // 15ms
    } else {
        buffer = chart.canvas.toBuffer("image/jpeg", { quality: 0.9, chromaSubsampling: true }); // 3ms
    }
    // 1ms
    destroyChart_Async(chart);
    ChartCanvasManager.recycle(canvas);
    return buffer;
}

function renderToBufferX2(configuration: IChartConfiguration) {
    const canvas = ChartCanvasManager.getX2;
    const chart = new chartJs(canvas, configuration);
    const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 0.9, chromaSubsampling: true });
    destroyChart_Async(chart);
    ChartCanvasManager.recycleX2(canvas);
    return buffer;
}

async function destroyChart_Async(chart: Chart) {
    chart.destroy();
}

export { getStatsChartFromData, getChartTopChatsMonthly };
