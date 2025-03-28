import { isPremium } from "../../utils/isPremium.js";
import { IChartType } from "../getStatsChart.js";
import cacheManager from "../../cache/cache.js";
import { Database } from "../../db/db.js";
import { Image, loadImage } from "canvas";
import { Chart } from "chart.js/auto";
import fs from "fs";
import cfg from "../../config.js";

type IBackground = { bg: Image; transparent: boolean };

let defaultBg: Image;

async function getDefaultBg() {
    if (defaultBg === undefined) {
        defaultBg = await loadImage("data/chartBg/!default.jpg");
    }
    return defaultBg;
}

async function loadBgImage(id: number, specific?: "horny" | "uk"): Promise<IBackground> {
    let path = "";
    switch (specific) {
        case "horny":
            path = `${cfg.PATHS.BASE_BG_PATH}/!horny.jpg`;
            break;
        case "uk":
            path = `${cfg.PATHS.BASE_BG_PATH}/!ДЕРЖАВНОЮ.jpg`;
        default:
            path = `${cfg.PATHS.BASE_BG_PATH}/${id}.jpg`;
            break;
    }

    if ((await isPremium(id)) && fs.existsSync(`${cfg.PATHS.BASE_BG_PATH}/${id}.mp4`)) {
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
        beforeDraw: (chart: Chart) => {
            if (!image || image.transparent) return;
            if (image.bg.complete) {
                const ctx = chart.ctx;
                ctx.drawImage(image, 0, 0, chart.width, chart.height);
            } else {
                image.bg.onload = () => chart.draw();
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
                return createPlugin(await loadBgImage(chat_id));
            } else {
                Database.chatSettings.set(
                    chat_id,
                    cacheManager.ChatSettingsCache.set(chat_id, { usechatbgforall: false })
                );
            }
        }

        // Restrictions for the background image
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
