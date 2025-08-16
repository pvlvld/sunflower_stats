import type { Chart } from "chart.js";
import chartJs from "chart.js/auto";
import { Canvas, Image, loadImage } from "canvas";
import { overlayChartOnVideo } from "./utils/overlayChartOnVideo.js";
import { IChartFormat, IChartStatsTask } from "@sunflower-stats/shared";
import { getChartData } from "./utils/getChartData.js";
import { config } from "./consts/config.js";
import { getChartConfig, IChartConfiguration } from "./utils/getChartConfig.js";
import { ChartCanvasManager } from "./utils/chartCanvas.js";
import { createProfileImagesPlugin } from "plugins/profileImagesPlugin.js";
import fs from "node:fs";

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
    if (targetId === config.BOT_ID) {
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

async function destroyChart_Async(chart: Chart) {
    chart.destroy();
}
