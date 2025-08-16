import type { Image } from "canvas";

export function createProfileImagesPlugin(imageMap: Map<number, Image>) {
    return {
        id: "profileImages",
        afterDatasetsDraw(chart: any, args: any, options: any) {
            const { ctx } = chart;
            const imageSize = 72;

            let x = 0.0;
            let y = 0.0;

            for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
                const dataset = chart.data.datasets[datasetIndex];
                const chat_id = dataset.chat_id;
                const meta = chart.getDatasetMeta(datasetIndex);

                if (!imageMap.has(chat_id)) continue;

                const chatImage = imageMap.get(chat_id);

                for (let idx in meta.data) {
                    // don't draw images for data points with y > 10
                    if (dataset.data[idx].y === undefined || dataset.data[idx].y > 10) continue;
                    ({ x, y } = meta.data[idx].getCenterPoint());
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, imageSize / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(chatImage, x - imageSize / 2, y - imageSize / 2, imageSize, imageSize);
                    ctx.restore();
                }
            }
        },
    };
}
