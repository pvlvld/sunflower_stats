import { getStatsRatingToday } from "../utils/getStatsRating";
import type IActive from "../data/active";
import type TodayStats from "../data/stats";
import type { ChatTypeContext } from "grammy";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";

async function stats_today(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const stats = todayStats.data[ctx.chat.id];
  if (!stats || stats === undefined) return;

  await ctx.reply(
    "📊 Статистика чату за сьогодні:\n\n" + getStatsRatingToday(ctx.chat.id, todayStats, active),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_today;
