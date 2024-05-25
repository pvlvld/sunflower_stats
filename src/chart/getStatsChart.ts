//@ts-expect-error
import { Chart, ChartConfiguration } from "chart.js";
import { bgImagePlugin } from "./plugins/bgImagePlugin";
import DBPoolManager from "../db/db";
import { InputFile } from "grammy";
import { ChartCanvasManager } from "./chartCanvas";
const chartJs: typeof Chart = require("chart.js/auto");

async function getChatData(chat_id: number) {
  return (
    await DBPoolManager.getPoolRead.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${chat_id}
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

async function getChartConfig(): Promise<ChartConfiguration> {
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
            gradient.addColorStop(0, "#e9bd07");
            gradient.addColorStop(0.9, "#0f0a10");
            gradient.addColorStop(1, "#050414");
            return gradient;
          },
          tension: 0.2,
        },
      ],
    },
    options: {
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
            display: true,
            color: "#161525",
          },
          border: {
            dash: [8, 4],
            width: 4,
          },
          ticks: {
            color: "#e8e7ec",
            font: {
              weight: "bold",
            },
          },
        },
        y: {
          grid: {
            display: true,
            color: "#161525",
          },
          border: {
            dash: [8, 4],
            width: 4,
          },
          ticks: {
            color: "#e8e7ec",
            font: {
              weight: "bold",
            },
          },
        },
      },
    },
    plugins: [await bgImagePlugin()],
  };
}

/**Rerutns @InputFile success @undefined stats contain less than 7 records*/
export async function getStatsChart(
  chat_id: number,
  user_id?: number
): Promise<InputFile | undefined> {
  let data: any[];
  if (user_id) {
    data = await getUserData(chat_id, user_id);
    void data.pop();
  } else {
    data = await getChatData(chat_id);
    void data.pop();
  }

  if (data.length < 7) {
    return undefined;
  }

  if (data[0].x === "2023-12-31") {
    void data.shift();
  }

  const configuration = await getChartConfig();
  configuration.data.datasets[0].data = data;
  configuration.data.labels = data.map((v) => v["x"]);

  return new InputFile(await renderToBuffer(configuration), "test.jpg");
}

function renderToBuffer(configuration: ChartConfiguration) {
  const canvas = ChartCanvasManager.get;
  const chart = new chartJs(canvas, configuration);
  const buffer = chart.canvas.toBuffer("image/jpeg");
  destroyChart_Async(chart);
  ChartCanvasManager.recycle(canvas);
  return buffer;
}

async function destroyChart_Async(chart: Chart) {
  chart.destroy();
}
