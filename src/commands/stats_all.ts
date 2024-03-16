import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type DbStats from "../db/stats";
import type IActive from "../data/active";
import type TodayStats from "../data/stats";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { ChatTypeContext, HearsContext } from "grammy";

async function stats_all(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const start = Date.now();
  const stats = await dbStats.chat.all(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    await ctx.reply("Щось пішло не так.");
    return;
  }

  const queryTime = Date.now();
  const msg =
    "📊 Статистика чату за весь час:\n\n" +
    getStatsRatingPlusToday(stats, ctx.chat.id, todayStats, active);
  const msgTime = Date.now();

  await ctx.reply(msg, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });

  if (ctx.chat.id === -1001898242958) {
    ctx.reply(
      `DB: ${queryTime - start}ms\nGen: ${msgTime - queryTime}ms\nTotal: ${msgTime - start}ms`
    );
  }
}

export default stats_all;
