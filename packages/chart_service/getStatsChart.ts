import type { Chart } from "chart.js";
import chartJs from "chart.js/auto";
import { Canvas, Image, loadImage } from "canvas";
import { overlayChartOnVideo } from "./utils/overlayChartOnVideo.js";
import { IChartFormat, IChartStatsTask } from "@sunflower-stats/shared";
import { getChartData } from "./utils/getChartData.js";
import { config } from "./consts/config.js";
import { getChartConfig, IChartConfiguration } from "./utils/getChartConfig.js";
import { ChartCanvasManager } from "./utils/chartCanvas.js";
import { createProfileImagesPlugin } from "./plugins/profileImagesPlugin.js";
import fs from "node:fs";
import { downloadChatPic } from "./utils/downloadChatPic.js";

export type IChartType = "user" | "chat" | "bot-all";

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

/**Rerutns @Buffer success @undefined stats contain less than 7 records*/
export async function getStatsChart(
    task: IChartStatsTask
): Promise<{ chart: Buffer; chartFormat: IChartFormat } | undefined> {
    const targetId = task.target_id;
    const type = targetId === config.BOT_ID ? "bot-all" : targetId > 0 ? "user" : "chat";
    let data: any[];

    // Shitty workaround? Yes it is!
    if (task.date_range[2] === "global") {
        data = await getChartData.userGlobal(task);
    } else if (targetId === config.BOT_ID) {
        data = await getChartData.botTotal();
    } else if (targetId > 0) {
        data = await getChartData.userInChat(task);
    } else if (targetId < 0) {
        data = await getChartData.chatInChat(task);
    } else {
        throw new Error("Invalid chart type");
    }

    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    // if (data.length < 2) {
    //     return undefined;
    // }

    // TODO: Implement redis daily stats with timestamp
    // Use redis stats for the today chat stats
    // and for users that have less that 3 days of stats in the main DB

    const configuration = await getChartConfig.default(task, type);
    configuration.data.datasets[0].data = data;
    configuration.data.labels = data.map((v) => v["x"]);

    if (configuration.custom.transparent) {
        return {
            chart: await overlayChartOnVideo(await renderToBuffer(configuration), task),
            chartFormat: "video",
        };
    } else {
        return {
            chart: await renderToBuffer(configuration),
            chartFormat: "image",
        };
    }
}

export async function getChartTopChatsMonthly(positions: number = 10) {
    const data = await getChartData.chatsTopMonthly();
    const config = getChartConfig.topChatsMonthly(positions);
    config.data.datasets = prepareBumpChartData(data) as any; // FIX:
    config.plugins!.push(
        createProfileImagesPlugin(
            await preloadChatImages([
                ...new Set(config.data.datasets.map((dataset: any) => dataset.chat_id)),
            ] as number[])
        )
    );
    return await renderToBufferX2(config);
}

function renderToBuffer(configuration: IChartConfiguration): Promise<Buffer> {
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

function renderToBufferX2(configuration: IChartConfiguration): Promise<Buffer> {
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

async function getChatImage(chat_id: number): Promise<Image> {
    // Load image from disk
    if (fs.existsSync(`./data/profileImages/${chat_id}.jpg`)) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    }
    // dont parallelized to avoid angering the telegram api
    const isDownloaded = await downloadChatPic(chat_id);
    if (isDownloaded) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    } else {
        return await loadImage(`./data/profileImages/!default.jpg`);
    }
}

function prepareBumpChartData(sqlResults: any[]): BumpChartSeries[] {
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
