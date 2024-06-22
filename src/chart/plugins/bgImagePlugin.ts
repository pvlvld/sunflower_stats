import { Image, loadImage } from "canvas";
//@ts-expect-error
import { Chart } from "chart.js/auto";
import { isPremium } from "../../utils/isPremium";
import fs from "fs";
import { IChartType } from "../getStatsChart";
import cacheManager from "../../cache/cache";
import { Database } from "../../db/db";

const baseBgPath = "./data/chartBg";

let defaultBg: Image;

async function getDefaultBg() {
  if (defaultBg) {
    return defaultBg;
  }

  defaultBg = await loadImage("data/chartBg/!default.jpg");
  return defaultBg;
}

async function loadBgImage(id: number): Promise<Image> {
  const path = `${baseBgPath}/${id}.jpg`;
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
        ctx.drawImage(image, 0, 0);
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

    //TODO: don't forget to reenable it
    // if (await isPremium(user_id)) {
    pluginBgImage = await loadBgImage(user_id);
    return createPlugin(pluginBgImage);
    // }

    // pluginBgImage = await getDefaultBg();
  }

  return createPlugin(pluginBgImage);
}

export { bgImagePlugin };
