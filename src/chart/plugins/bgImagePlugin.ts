import { Image, loadImage } from "canvas";
//@ts-expect-error
import { Chart } from "chart.js/auto";
import { isPremium } from "../../utils/isPremium";
import fs from "fs";
import { IChartType } from "../getStatsChart";

const baseBgPath = "./data/chartBg";

let defaultBg: Image;

async function bgImagePlugin(chat_id: number, user_id: number, type: IChartType) {
  let pluginBgImage: Image;
  // const isChatPremium = await isPremium(chat_id);
  // const isUserPremium = await isPremium(user_id);

  if (type === "chat") {
    if (fs.existsSync(`${baseBgPath}/${chat_id}.jpg`)) {
      pluginBgImage = await loadImage(`${baseBgPath}/${user_id}.jpg`);
    } else {
      pluginBgImage = await getDefaultBg();
    }
  } else {
    // TODO:
    // 1. premium chat global custom gb settings
    // 2. premium user only
    // (in that order)
    if (fs.existsSync(`${baseBgPath}/${user_id}.jpg`)) {
      pluginBgImage = await loadImage(`${baseBgPath}/${user_id}.jpg`);
    } else {
      pluginBgImage = await getDefaultBg();
    }
  }

  return {
    id: "customCanvasBackgroundImage",
    beforeDraw: (chart: Chart) => {
      if (pluginBgImage.complete) {
        const ctx = chart.ctx;
        ctx.drawImage(pluginBgImage, 0, 0);
      } else {
        pluginBgImage.onload = () => chart.draw();
      }
    },
  };
}

async function getDefaultBg() {
  if (defaultBg) {
    return defaultBg;
  }

  defaultBg = await loadImage("data/chartBg/!default.jpg");
  return defaultBg;
}

export { bgImagePlugin };
