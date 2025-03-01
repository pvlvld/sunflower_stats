import type { IAllowedChartStatsRanges } from "../commands/stats_chat.js";
import { bgImagePlugin } from "./plugins/bgImagePlugin.js";
import { ChartCanvasManager } from "./chartCanvas.js";
import type { Chart, ChartConfiguration, LabelItem, Scale } from "chart.js";
import { DBPoolManager } from "../db/poolManager.js";
import { hexToRGB } from "../utils/hexToRGB.js";
import formattedDate from "../utils/date.js";
import chartJs from "chart.js/auto";
import { InputFile } from "grammy";
import { type Image, loadImage } from "canvas";
import fs from "node:fs";
import { downloadChatProfileImage } from "./utils/downloadProfileImage.js";
import { getChartSettings } from "./utils/getChartSettings.js";

export type IChartType = "user" | "chat" | "bot-all";

async function getChatData(chat_id: number, rawDateRange: IAllowedChartStatsRanges) {
    const dateRange = formattedDate[rawDateRange];
    return (
        await DBPoolManager.getPoolRead.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${chat_id} AND date BETWEEN '${dateRange[0]}' AND '${dateRange[1]}'
          GROUP BY date
          ORDER BY date;`)
    ).rows;
}

async function getUserData(chat_id: number, user_id: number) {
    return (
        await DBPoolManager.getPoolRead.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, count AS y
      FROM stats_daily
      WHERE user_id = ${user_id} AND chat_id = ${chat_id}
      ORDER BY date;`
        )
    ).rows;
}

async function getChartConfig(chat_id: number, user_id: number, type: IChartType): Promise<ChartConfiguration> {
    const chart_settings = await getChartSettings(type === "chat" ? chat_id : user_id, type);
    const line_rgbValuesString = getRGBValueString(chart_settings.line_color);

    return {
        type: "line",
        data: {
            labels: [] as LabelItem[],
            datasets: [
                {
                    // biome-ignore lint/suspicious/noExplicitAny: <lazyness>
                    data: [] as any[],
                    borderColor: `rgb(${line_rgbValuesString})`,
                    borderCapStyle: "round",
                    fill: true,
                    backgroundColor: (context: any) => {
                        if (!context.chart.chartArea) {
                            return;
                        }
                        const { ctx, chartArea } = context.chart;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(1, `rgba(${line_rgbValuesString}, 0)`);
                        gradient.addColorStop(0.6, `rgba(${line_rgbValuesString}, 0.4)`);
                        gradient.addColorStop(0, `rgba(${line_rgbValuesString}, 0.9)`);
                        return gradient;
                    },
                    tension: 0.2,
                },
            ],
        },
        options: {
            layout: {
                padding: {
                    top: 80,
                },
            },
            color: "#e8e7ec",
            datasets: {
                line: {
                    pointRadius: 0,
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
            animation: false,
            responsive: false,
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: `#${chart_settings.font_color}`,
                        font: {
                            weight: "bold",
                        },
                        textStrokeColor: "#000000",
                        textStrokeWidth: 1,
                    },
                },
                y: {
                    min: type === "bot-all" ? 600000 : undefined,
                    afterBuildTicks: (scale: Scale) => {
                        if (type === "bot-all") {
                            scale.ticks[0].value = 600000;
                        }
                    },
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: `#${chart_settings.font_color}`,
                        font: {
                            weight: "bold",
                        },
                        textStrokeColor: "#000000",
                        textStrokeWidth: 1,
                    },
                },
            },
        },
        plugins: [await bgImagePlugin(chat_id, user_id, type)],
    };
}

/**Rerutns @InputFile success @undefined stats contain less than 7 records*/
export async function getStatsChart(
    chat_id: number,
    user_id: number,
    type: IChartType,
    rawDateRange?: IAllowedChartStatsRanges
): Promise<InputFile | undefined> {
    let data: any[];
    if (type === "user") {
        data = await getUserData(chat_id, user_id);
    } else if (type === "chat") {
        if (rawDateRange) {
            data = await getChatData(chat_id, rawDateRange);
        } else {
            console.error("No date range is provided for the chat chart");
            data = await getChatData(chat_id, "all");
        }
    } else if (type === "bot-all") {
        data = (
            await DBPoolManager.getPoolRead.query(
                `SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y FROM stats_daily WHERE date > '2023-12-31' GROUP BY date ORDER BY date;`
            )
        ).rows;
    } else {
        throw new Error("Invalid chart type");
    }
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig(chat_id, user_id, type);
    configuration.data.datasets[0].data = data;
    configuration.data.labels = data.map((v) => v["x"]);

    return new InputFile(await renderToBuffer(configuration), "chart.jpg");
}

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

async function getChatImage(chat_id: number): Promise<Image> {
    // Load image from disk
    if (fs.existsSync(`./data/profileImages/${chat_id}.jpg`)) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    }
    // dont parallelized to avoid angering the telegram api
    const isDownloaded = await downloadChatProfileImage(chat_id);
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
            const imageSize = 60;

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

const topChatsMonthlyConfig: ChartConfiguration = {
    type: "line",
    data: {
        //@ts-expect-error
        datasets: [] as ReturnType<typeof prepareBumpChartData>, // FIX:
    },
    options: {
        elements: {
            line: {
                tension: 0.2,
                borderWidth: 8,
            },
        },
        scales: {
            y: {
                reverse: true,
                min: 1,
                max: 10,
                ticks: {
                    padding: 35,
                    count: 10,
                    font: {
                        size: 28,
                    },
                },
            },
            x: {
                ticks: {
                    padding: 45,
                    font: {
                        size: 28,
                    },
                },
            },
        },
        locale: "uk-UA",
        color: "#e8e7ec",
        datasets: {
            line: {
                pointRadius: 34,
                borderJoinStyle: "round",
                // clip: 20,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                bodyFont: { size: 28 },
            },
            //@ts-expect-error
            profileImages: {},
        },
        animation: false,
        responsive: false,
        clip: 35,
        font: {
            size: 28,
        },
    },
    plugins: [],
};

async function getChartTopChatsMonthly(data: any) {
    const config = { ...topChatsMonthlyConfig };
    config.data.datasets = prepareBumpChartData(data) as any; // FIX:
    config.plugins = [
        createProfileImagesPlugin(
            await preloadChatImages([
                ...new Set(config.data.datasets.map((dataset: any) => dataset.chat_id)),
            ] as number[])
        ),
    ];
    return new InputFile(await renderToBufferX2(config), "chart.jpg");
}

async function getStatsChartFromData(
    chat_id: number,
    user_id: number,
    type: IChartType,
    data: { x: string; y: number }[]
): Promise<InputFile | undefined> {
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig(chat_id, user_id, type);
    configuration.data.datasets[0].data = data as any;
    configuration.data.labels = data.map((v) => v["x"]);

    return new InputFile(await renderToBuffer(configuration), "chart.jpg");
}

function renderToBuffer(configuration: ChartConfiguration) {
    const canvas = ChartCanvasManager.get;
    const chart = new chartJs(canvas, configuration);
    const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 1 });
    destroyChart_Async(chart);
    ChartCanvasManager.recycle(canvas);
    return buffer;
}

function renderToBufferX2(configuration: ChartConfiguration) {
    const canvas = ChartCanvasManager.getX2;
    const chart = new chartJs(canvas, configuration);
    const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 1 });
    destroyChart_Async(chart);
    ChartCanvasManager.recycleX2(canvas);
    return buffer;
}

async function destroyChart_Async(chart: Chart) {
    chart.destroy();
}

function getRGBValueString(hex: string) {
    const rgb = hexToRGB(hex)!;
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export { getStatsChartFromData, getChartTopChatsMonthly };
