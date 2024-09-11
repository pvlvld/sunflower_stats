import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { IAllowedChartStatsRanges } from "../commands/stats_chat.js";
import { bgImagePlugin } from "./plugins/bgImagePlugin.js";
import { IChartSettings } from "../db/chartSettings.js";
import { ChartCanvasManager } from "./chartCanvas.js";
import { Chart, ChartConfiguration } from "chart.js";
import { DBPoolManager } from "../db/poolManager.js";
import { hexToRGB } from "../utils/hexToRGB.js";
import formattedDate from "../utils/date.js";
import { Database } from "../db/db.js";
import chartJs from "chart.js/auto";
import { InputFile } from "grammy";

export type IChartType = "user" | "chat";

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
      WHERE user_id = ${user_id} AND chat_id = ${chat_id};`
        )
    ).rows;
}

async function getChartSettings(target_id: number): Promise<IChartSettings> {
    if (Math.sign(target_id) === -1) {
        // Chat
        const chat_settings = await getCachedOrDBChatSettings(target_id);
        return { line_color: chat_settings.line_color, font_color: chat_settings.font_color };
    } else {
        // User
        return await Database.userSettings.get(target_id);
    }
}

async function getChartConfig(
    chat_id: number,
    user_id: number,
    type: IChartType
): Promise<ChartConfiguration> {
    const chart_settings = await getChartSettings(type === "chat" ? chat_id : user_id);
    const line_rgbValuesString = getRGBValueString(chart_settings.line_color);

    return {
        type: "line",
        data: {
            labels: [] as any[],
            datasets: [
                {
                    data: [] as any[],
                    borderColor: `rgb(${line_rgbValuesString})`,
                    borderCapStyle: "round",
                    fill: true,
                    backgroundColor: (context: any) => {
                        if (!context.chart.chartArea) {
                            return;
                        }
                        const { ctx, chartArea } = context.chart;
                        const gradient = ctx.createLinearGradient(
                            0,
                            chartArea.top,
                            0,
                            chartArea.bottom
                        );
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
    } else {
        if (rawDateRange) {
            data = await getChatData(chat_id, rawDateRange);
        } else {
            console.error("No date range is provided for the chat chart");
            data = await getChatData(chat_id, "all");
        }
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

    return new InputFile(await renderToBuffer(configuration), "test.jpg");
}

function renderToBuffer(configuration: ChartConfiguration) {
    const canvas = ChartCanvasManager.get;
    const chart = new chartJs(canvas, configuration);
    const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 1 });
    destroyChart_Async(chart);
    ChartCanvasManager.recycle(canvas);
    return buffer;
}

async function destroyChart_Async(chart: Chart) {
    chart.destroy();
}

function getRGBValueString(hex: string) {
    const rgb = hexToRGB(hex)!;
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}
