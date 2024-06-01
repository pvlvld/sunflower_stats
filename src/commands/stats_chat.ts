import type { IGroupTextContext } from "../types/context";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import { getStatsChart } from "../chart/getStatsChart";
import { botStatsManager } from "./botStats";
import cacheManager from "../cache/cache";
import { DBStats } from "../db/stats";
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
  const rawCmdDateRange = (
    (ctx.msg.text ?? ctx.msg.caption).split(" ")[1] ?? "сьогодні"
  ).toLowerCase() as keyof typeof cmdToDateRangeMap;
  const dateRange = cmdToDateRangeMap[rawCmdDateRange];

  const start = String(process.hrtime.bigint());
  const chat_id = ctx.chat.id;
  const stats = await DBStats.chat.inRage(chat_id, dateRange);
  const queryTime = String(process.hrtime.bigint());

  if (stats.length === 0) {
    // TODO: meme
  }

  const statsMessage =
    `📊 Статистика чату за ${dateRange === "all" ? "весь час" : rawCmdDateRange}:\n\n` +
    getStatsRatingPlusToday(stats, chat_id);

  const msgTime = String(process.hrtime.bigint());
  let chartTime = "";

  if (allowedChartStatsRanges.includes(dateRange as IAllowedChartStatsRanges)) {
    const cachedChart = cacheManager.ChartCache_Chat.get(
      chat_id,
      dateRange as IAllowedChartStatsRanges
    );

    if (cachedChart.status === "ok") {
      chartTime = String(process.hrtime.bigint());
      return void (await ctx
        .replyWithPhoto(cachedChart.file_id, { caption: statsMessage, disable_notification: true })
        .catch((e) => {}));
    } else {
      const chartImage = await getStatsChart(
        chat_id,
        chat_id,
        "chat",
        dateRange as IAllowedChartStatsRanges
      );

      if (chartImage) {
        chartTime = String(process.hrtime.bigint());
        const msg = await ctx
          .replyWithPhoto(chartImage, {
            caption: statsMessage,
            disable_notification: true,
          })
          .catch((e) => {
            console.log(e);
          });

        if (msg) {
          cacheManager.ChartCache_Chat.set(
            chat_id,
            dateRange as IAllowedChartStatsRanges,
            msg.photo[msg.photo.length - 1].file_id
          );
        }

        return;
      }
    }
  }

  await ctx.reply(statsMessage, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });

  botStatsManager.commandUse(`стата ${rawCmdDateRange}`);
  if (chat_id === -1001898242958) {
    ctx.reply(
      `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
        .minus(queryTime)
        .div(1000000)}ms\nChart: ${new Big(chartTime)
        .minus(msgTime)
        .div(1000000)}ms}\nTotal: ${new Big(chartTime).minus(start).div(1000000)}ms`
    );
  }
}

export default stats_chat;
