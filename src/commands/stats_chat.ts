import type { IGroupTextContext } from "../types/context";
const Big = require("big-js");
import dbStats from "../db/stats";
import { botStatsManager } from "./botStats";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";

const cmdToDateRangeMap = {
  сьогодні: "today",
  вчора: "yesterday",
  тиждень: "weekRange",
  місяць: "monthRange",
  рік: "yearRange",
  вся: "all",
  undefined: "today",
} as const;

async function stats_chat(ctx: IGroupTextContext): Promise<void> {
  const rawCmdDateRange = (
    (ctx.msg.text ?? ctx.msg.caption).split(" ")[1] ?? "сьогодні"
  ).toLowerCase() as keyof typeof cmdToDateRangeMap;
  const dateRange = cmdToDateRangeMap[rawCmdDateRange];

  const start = String(process.hrtime.bigint());
  const chat_id = ctx.chat.id;
  const stats = await dbStats.chat.inRage(chat_id, dateRange);
  const queryTime = String(process.hrtime.bigint());

  const msg =
    `📊 Статистика чату за ${dateRange === "all" ? "весь час" : rawCmdDateRange}:\n\n` +
    getStatsRatingPlusToday(stats, chat_id);
  const msgTime = String(process.hrtime.bigint());

  await ctx.reply(msg, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });

  botStatsManager.commandUse(`стата ${rawCmdDateRange}`);
  if (chat_id === -1001898242958) {
    ctx.reply(
      `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
        .minus(queryTime)
        .div(1000000)}ms\nTotal: ${new Big(msgTime).minus(start).div(1000000)}ms`
    );
  }
}

export default stats_chat;
