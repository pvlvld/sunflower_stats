import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import DbStats from "../db/stats";
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
  await ctx.reply(
    "📊 Статистика чату за цей місяць:\n\n" +
      getStatsRatingPlusToday(
        await dbStats.chat.inRage(ctx.chat.id, "monthRange"),
        ctx.chat.id,
        todayStats,
        active
      ),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_month;
