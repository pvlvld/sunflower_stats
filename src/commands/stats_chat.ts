import type { IGroupTextContext } from "../types/context";
import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import { getStatsChart } from "../chart/getStatsChart";
import { botStatsManager } from "./botStats";
import cacheManager from "../cache/cache";
import { DBStats } from "../db/stats";
import { IDBChatUserStats } from "../types/stats";
const Big = require("big-js");

const cmdToDateRangeMap = {
  сьогодні: "today",
  вчора: "yesterday",
  тиждень: "weekRange",
  місяць: "monthRange",
  рік: "yearRange",
  вся: "all",
  undefined: "today",
} as const;

type IDateRange = (typeof cmdToDateRangeMap)[keyof typeof cmdToDateRangeMap];
export type IAllowedChartStatsRanges = Exclude<IDateRange, "today" | "yesterday" | "weekRange">;

const allowedChartStatsRanges: IAllowedChartStatsRanges[] = [
  "monthRange",
  "yearRange",
  "all",
] as const;

// TODO: use await Promise.all() for chart + msg

async function stats_chat(ctx: IGroupTextContext): Promise<void> {
  const chat_id = ctx.chat.id;
  const chatSettings = await getCachedOrDBChatSettings(chat_id);
  const rawCmdDateRange = (
    (ctx.msg.text ?? ctx.msg.caption).split(" ")[1] ?? "сьогодні"
  ).toLowerCase() as keyof typeof cmdToDateRangeMap;
  const dateRange = cmdToDateRangeMap[rawCmdDateRange];

  const start = String(process.hrtime.bigint());
  const stats = await DBStats.chat.inRage(chat_id, dateRange);
  const queryTime = String(process.hrtime.bigint());
  let msgTime = "";
  let chartTime = "";
  let reply: Awaited<ReturnType<typeof sendSelfdestructMessage>> = undefined;

  if (stats.length === 0) {
    // TODO: meme
  }

  if (
    allowedChartStatsRanges.includes(dateRange as IAllowedChartStatsRanges) &&
    chatSettings.charts
  ) {
    const cachedChart = cacheManager.ChartCache_Chat.get(
      chat_id,
      dateRange as IAllowedChartStatsRanges
    );

    if (cachedChart.status === "ok") {
      const statsMessage = getStatsMessage(chat_id, dateRange, rawCmdDateRange, stats, true);
      msgTime = String(process.hrtime.bigint());
      chartTime = msgTime;

      reply = await sendSelfdestructMessage(
        ctx,
        {
          isChart: true,
          text: statsMessage,
          chart: cachedChart.file_id,
        },
        chatSettings.selfdestructstats
      );
    } else if (cachedChart.status === "unrendered") {
      const statsMessage = getStatsMessage(chat_id, dateRange, rawCmdDateRange, stats, true);
      msgTime = String(process.hrtime.bigint());

      const chartImage = await getStatsChart(
        chat_id,
        chat_id,
        "chat",
        dateRange as IAllowedChartStatsRanges
      );

      if (chartImage) {
        chartTime = String(process.hrtime.bigint());

        reply = await sendSelfdestructMessage(
          ctx,
          {
            isChart: true,
            text: statsMessage,
            chart: chartImage,
          },
          chatSettings.selfdestructstats
        );

        if (reply) {
          cacheManager.ChartCache_Chat.set(
            chat_id,
            dateRange as IAllowedChartStatsRanges,
            reply.photo[reply.photo.length - 1].file_id
          );
        }
      }
    }
  }

  if (reply === undefined) {
    const statsMessage = getStatsMessage(chat_id, dateRange, rawCmdDateRange, stats, false);
    msgTime = String(process.hrtime.bigint());

    reply = await sendSelfdestructMessage(
      ctx,
      {
        isChart: false,
        text: statsMessage,
        chart: undefined,
      },
      chatSettings.selfdestructstats
    );
  }

  botStatsManager.commandUse(`стата ${rawCmdDateRange}`);
  if (chat_id === -1001898242958) {
    if (!chartTime) {
      chartTime = msgTime;
    }
    ctx.reply(
      `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
        .minus(queryTime)
        .div(1000000)}ms\nChart: ${new Big(chartTime)
        .minus(msgTime)
        .div(1000000)}ms\nTotal: ${new Big(chartTime).minus(start).div(1000000)}ms`
    );
  }
}

function getStatsMessage(
  chat_id: number,
  dateRange: IDateRange,
  rawCmdDateRange: keyof typeof cmdToDateRangeMap,
  stats: IDBChatUserStats[],
  chart: boolean
) {
  return (
    `📊 Статистика чату за ${dateRange === "all" ? "весь час" : rawCmdDateRange}:\n\n` +
    getStatsRatingPlusToday(stats, chat_id, chart ? "caption" : "text")
  );
}

export default stats_chat;
