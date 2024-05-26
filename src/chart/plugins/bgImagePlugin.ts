import { Image, loadImage } from "canvas";
//@ts-expect-error
import { Chart } from "chart.js/auto";

const pluginBgImage = new Image();
pluginBgImage.src = "data/chartBg/!default.jpg";

let defaultBg: Image;

async function bgImagePlugin(bg = defaultBg) {
  let pluginBgImage: Image;
  if (defaultBg) {
    pluginBgImage = defaultBg;
  } else {
    pluginBgImage = await loadImage("data/chartBg/!default.jpg");
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

export { bgImagePlugin };
