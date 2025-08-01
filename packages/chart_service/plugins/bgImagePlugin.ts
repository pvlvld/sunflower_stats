import { Image, loadImage } from "canvas";
import { Chart } from "chart.js/auto";
import fs from "fs";
import type { IChartTask, IChartType } from "@sunflower-stats/shared";
import { isPremium } from "../utils/isPremium.js";

type IBackground = { bg: Image; transparent: boolean };

const baseBgPath = "../../data/chartBg";
let defaultBg: Image;

async function getDefaultBg() {
    if (defaultBg === undefined) {
        defaultBg = await loadImage("data/chartBg/!default.jpg");
    }
    return defaultBg;
}

async function loadBgImage(task: IChartTask, target: number): Promise<IBackground> {
    let path = `${baseBgPath}/${target}.jpg`;

    if (isPremium(task, target) && fs.existsSync(`${baseBgPath}/${target}.mp4`)) {
        return {
            bg: {} as Image,
            transparent: true,
        };
    }

    if (fs.existsSync(path)) {
        return { bg: await loadImage(path), transparent: false };
    }

    return { bg: await getDefaultBg(), transparent: false };
}

function createPlugin(image: IBackground | undefined) {
    return {
        id: "customCanvasBackgroundImage",
        transparent: image?.transparent || false,
        beforeDraw: (chart: Chart) => {
            if (!image || image.transparent) return;
            if (image.bg.complete) {
                const ctx = chart.ctx;
                ctx.drawImage(image.bg, 0, 0, chart.width, chart.height);
            } else {
                image.bg.onload = () => chart.draw();
            }
        },
    };
}

async function bgImagePlugin(task: IChartTask, type: IChartType) {
    let pluginBgImage: IBackground;
    const { chat_id, user_id } = task;

    if (type === "chat" || (task.usechatbgforall && isPremium(task, chat_id))) {
        pluginBgImage = await loadBgImage(task, chat_id);
    } else {
        pluginBgImage = await loadBgImage(task, user_id);
    }

    return createPlugin(pluginBgImage);
}

export { bgImagePlugin };
