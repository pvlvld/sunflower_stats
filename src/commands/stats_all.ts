import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type DbStats from "../db/stats";
import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import { active } from "../data/active";
const Big = require("big-js");

async function stats_all(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats
) {
  const start = String(process.hrtime.bigint());
  const stats = await dbStats.chat.all(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    await ctx.reply("Щось пішло не так.");
    return;
  }

  const queryTime = String(process.hrtime.bigint());
  const msg = "📊 Статистика чату за весь час:\n\n" + getStatsRatingPlusToday(stats, ctx.chat.id);
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
