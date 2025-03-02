import type { ChartConfiguration, LabelItem, Scale } from "chart.js";
import type { IChartType } from "../getStatsChart.js";
import { getChartSettings } from "./getChartSettings.js";
import { bgImagePlugin } from "../plugins/bgImagePlugin.js";
import { hexToGgbString } from "./hexToGgbString.js";

async function getDefaultChartConfig(chat_id: number, user_id: number, type: IChartType): Promise<ChartConfiguration> {
    const chart_settings = await getChartSettings(type === "chat" ? chat_id : user_id, type);
    const line_rgbValuesString = hexToGgbString(chart_settings.line_color);

    return {
        type: "line",
        data: {
            labels: [] as LabelItem[],
            datasets: [
                {
                    // biome-ignore lint/suspicious/noExplicitAny: <lazyness>
                    data: [] as any[],
                    borderColor: `rgb(${line_rgbValuesString})`,
                    borderCapStyle: "round",
                    fill: true,
                    backgroundColor: (context: any) => {
                        if (!context.chart.chartArea) {
                            return;
                        }
                        const { ctx, chartArea } = context.chart;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(1, `rgba(${line_rgbValuesString}, 0)`);
                        gradient.addColorStop(0.6, `rgba(${line_rgbValuesString}, 0.4)`);
                        gradient.addColorStop(0, `rgba(${line_rgbValuesString}, 0.9)`);
                        return gradient;
                    },
                    tension: 0.2,
                },
            ],
        },
        options: {
            layout: {
                padding: {
                    top: 80,
                },
            },
            color: "#e8e7ec",
            datasets: {
                line: {
                    pointRadius: 0,
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
            animation: false,
            responsive: false,
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: `#${chart_settings.font_color}`,
                        font: {
                            weight: "bold",
                        },
                        textStrokeColor: "#000000",
                        textStrokeWidth: 1,
                    },
                },
                y: {
                    min: type === "bot-all" ? 600000 : undefined,
                    afterBuildTicks: (scale: Scale) => {
                        if (type === "bot-all") {
                            scale.ticks[0].value = 600000;
                        }
                    },
                    grid: {
                        display: false,
                    },
                    border: {
                        display: false,
                    },
                    ticks: {
                        color: `#${chart_settings.font_color}`,
                        font: {
                            weight: "bold",
                        },
                        textStrokeColor: "#000000",
                        textStrokeWidth: 1,
                    },
                },
            },
        },
        plugins: [await bgImagePlugin(chat_id, user_id, type)],
    };
}

const getChartConfig = {
    default: getDefaultChartConfig,
};

export { getChartConfig };
