import { Chart } from "chart.js";

const bgColorPlugin = {
    id: "customCanvasBackgroundColor",
    beforeDraw: (chart: Chart, args: unknown, options: { color?: string }) => {
        console.log(options.color);
        // if (1) throw new Error(options.color);
        const { ctx } = chart;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = options.color || "#000000";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    },
};

export { bgColorPlugin };
//     sqlResults.forEach((row) => {
