import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import TodayStats from "../data/stats";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function stats_month(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const stats = await dbStats.chat.month(ctx.chat.id);

  ctx.reply(
    "📊 Статистика чату за цей місяць:\n\n" +
      getStatsRatingPlusToday(stats, ctx.chat.id, todayStats, active),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_month;
