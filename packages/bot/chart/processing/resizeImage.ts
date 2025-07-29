import { ChartCanvasManager } from "../chartCanvas.js";
import cfg from "../../config.js";
import { Image } from "canvas";

function resizeImage(buffer: Buffer) {
    const image = new Image();
    image.src = buffer;

    const originalWidth = image.width;
    const originalHeight = image.height;

    const originalRatio = originalWidth / originalHeight;
    const targetRatio = cfg.CHART.ratio;

    let targetWidth, targetHeight, offsetX, offsetY;

    // Offset calc
    if (originalRatio > targetRatio) {
        // Img wider
        targetWidth = originalHeight * targetRatio;
        targetHeight = originalHeight;
        offsetX = (originalWidth - targetWidth) / 2;
        offsetY = 0;
    } else {
        // Img higher
        targetWidth = originalWidth;
        targetHeight = originalWidth / targetRatio;
        offsetX = 0;
        offsetY = (originalHeight - targetHeight) / 2;
    }

    const canvas = ChartCanvasManager.get;

    canvas
        .getContext("2d")
        .drawImage(
            image,
            offsetX,
            offsetY,
            targetWidth,
            targetHeight,
            0,
            0,
            cfg.CHART.width,
            cfg.CHART.height
        );

    const result = canvas.toBuffer("image/jpeg");
    ChartCanvasManager.recycle(canvas);

    return result;
}

export { resizeImage };
