//@ts-expect-error
import { Chart, ChartConfiguration } from "chart.js";
import { bgImagePlugin } from "./plugins/bgImagePlugin";
import { DBPoolManager } from "../db/poolManager";
import { InputFile } from "grammy";
import { ChartCanvasManager } from "./chartCanvas";
import formattedDate from "../utils/date";
import { IAllowedChartStatsRanges } from "../commands/stats_chat";
const chartJs: typeof Chart = require("chart.js/auto");

export type IChartType = "user" | "chat";

async function getChatData(chat_id: number, rawDateRange: IAllowedChartStatsRanges) {
  const dateRange = formattedDate[rawDateRange];
  return (
    await DBPoolManager.getPoolRead.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${chat_id} AND date BETWEEN '${dateRange[0]}' AND '${dateRange[1]}'
          GROUP BY date
          ORDER BY date;`)
  ).rows;
}

async function getUserData(chat_id: number, user_id: number) {
  return (
    await DBPoolManager.getPoolRead.query(
      `SELECT to_char(date, 'YYYY-MM-DD') AS x, count AS y
      FROM stats_daily
      WHERE user_id = ${user_id} AND chat_id = ${chat_id};`
    )
  ).rows;
}

async function getChartConfig(
  chat_id: number,
  user_id: number,
  type: IChartType
): Promise<ChartConfiguration> {
  return {
    type: "line",
    data: {
      labels: [] as any[],
      datasets: [
        {
          data: [] as any[],
          borderColor: "#f3d319",
          borderCapStyle: "round",
          fill: true,
          backgroundColor: (context: any) => {
            if (!context.chart.chartArea) {
              return;
            }
            const { ctx, chartArea } = context.chart;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            gradient.addColorStop(0.6, "rgba(233, 189, 7, 0.4)");
            gradient.addColorStop(0, "rgba(233, 189, 7, 0.9)");
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
            // color: "#161525",
          },
          // border: {
          //   dash: [8, 4],
          //   width: 4,
          // },
          ticks: {
            color: "#e8e7ec",
            font: {
              weight: "bold",
            },
            textStrokeColor: "#000000",
            textStrokeWidth: 1,
          },
        },
        y: {
          grid: {
            display: false,
            // color: "#161525",
          },
          // border: {
          //   dash: [8, 4],
          //   width: 4,
          // },
          ticks: {
            color: "#e8e7ec",
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

/**Rerutns @InputFile success @undefined stats contain less than 7 records*/
export async function getStatsChart(
  chat_id: number,
  user_id: number,
  type: IChartType,
  rawDateRange?: IAllowedChartStatsRanges
): Promise<InputFile | undefined> {
  let data: any[];
  if (type === "user") {
    data = await getUserData(chat_id, user_id);
    void data.pop();
  } else {
    if (rawDateRange) {
      data = await getChatData(chat_id, rawDateRange);
      void data.pop();
    } else {
      console.error("No date range is provided for the chat chart");
      data = await getChatData(chat_id, "all");
    }
  }

  // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
  if (data[0].x === "2023-12-31") {
    void data.shift();
  }

  // do not render chart if data points count less than 3
  if (data.length < 3) {
    return undefined;
  }

  const configuration = await getChartConfig(chat_id, user_id, type);
  configuration.data.datasets[0].data = data;
  configuration.data.labels = data.map((v) => v["x"]);

  return new InputFile(await renderToBuffer(configuration), "test.jpg");
}

function renderToBuffer(configuration: ChartConfiguration) {
  const canvas = ChartCanvasManager.get;
  const chart = new chartJs(canvas, configuration);
  const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 1 });
  destroyChart_Async(chart);
  ChartCanvasManager.recycle(canvas);
  return buffer;
}

async function destroyChart_Async(chart: Chart) {
  chart.destroy();
}
