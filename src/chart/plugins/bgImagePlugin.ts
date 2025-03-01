import { isPremium } from "../../utils/isPremium.js";
import { IChartType } from "../getStatsChart.js";
import cacheManager from "../../cache/cache.js";
import { Database } from "../../db/db.js";
import { Image, loadImage } from "canvas";
import { Chart } from "chart.js/auto";
import fs from "fs";

const baseBgPath = "./data/chartBg";

let defaultBg: Image;

async function getDefaultBg() {
    if (defaultBg === undefined) {
        defaultBg = await loadImage("data/chartBg/!default.jpg");
    }
    return defaultBg;
}

async function loadBgImage(id: number, specific?: "horny" | "uk"): Promise<Image> {
    let path = "";
    switch (specific) {
        case "horny":
            path = `${baseBgPath}/!horny.jpg`;
            break;
        case "uk":
            path = `${baseBgPath}/!ДЕРЖАВНОЮ.jpg`;
        default:
            path = `${baseBgPath}/${id}.jpg`;
            break;
    }

    if (fs.existsSync(path)) {
        return loadImage(path);
    }

    return getDefaultBg();
}

function createPlugin(image: Image) {
    return {
        id: "customCanvasBackgroundImage",
        beforeDraw: (chart: Chart) => {
            if (image.complete) {
                const ctx = chart.ctx;
                ctx.drawImage(image, 0, 0, chart.width, chart.height);
            } else {
                image.onload = () => chart.draw();
            }
        },
    };
}

async function bgImagePlugin(chat_id: number, user_id: number, type: IChartType) {
    let pluginBgImage: Image;

    if (type === "chat") {
        pluginBgImage = await loadBgImage(chat_id);
    } else {
        if (cacheManager.ChatSettingsCache.get(chat_id)?.usechatbgforall || false) {
            if (await isPremium(chat_id)) {
                pluginBgImage = await loadBgImage(chat_id);
            } else {
                pluginBgImage = await loadBgImage(user_id);
                Database.chatSettings.set(
                    chat_id,
                    cacheManager.ChatSettingsCache.set(chat_id, { usechatbgforall: false })
                );
            }
            return createPlugin(pluginBgImage);
        }

        if (cacheManager.RestrictedUsersCache.isRestricted(user_id, "horny")) {
            pluginBgImage = await loadBgImage(user_id, "horny");
        } else if (cacheManager.RestrictedUsersCache.isRestricted(user_id, "uk")) {
            pluginBgImage = await loadBgImage(user_id, "uk");
        } else {
            pluginBgImage = await loadBgImage(user_id);
        }
        return createPlugin(pluginBgImage);
    }

    return createPlugin(pluginBgImage);
}

export { bgImagePlugin };
