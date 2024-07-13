import cfg from "../../config.js";
import sharp from "sharp";

async function resizeImage(inputBuffer: Buffer) {
  return await sharp(inputBuffer).resize(cfg.CHART.width, cfg.CHART.height).toBuffer();
}

export { resizeImage };
