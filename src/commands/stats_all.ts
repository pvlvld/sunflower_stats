import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type DbStats from "../db/stats";
import type IActive from "../data/active";
import type TodayStats from "../data/stats";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { ChatTypeContext, HearsContext } from "grammy";
const Big = require("big-js");

async function stats_all(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const start = String(process.hrtime.bigint());
  const stats = await dbStats.chat.all(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    await ctx.reply("Щось пішло не так.");
    return;
  }

  const queryTime = String(process.hrtime.bigint());
  const msg =
    "📊 Статистика чату за весь час:\n\n" +
    getStatsRatingPlusToday(stats, ctx.chat.id, todayStats, active);
  const msgTime = String(process.hrtime.bigint());

  await ctx.reply(msg, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });

  if (ctx.chat.id === -1001898242958) {
    ctx.reply(
      `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
        .minus(queryTime)
        .div(1000000)}ms\nTotal: ${new Big(msgTime).minus(start).div(1000000)}ms`
    );
  }
}

export default stats_all;
