import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type IActive from "../data/active";
import type { ChatTypeContext } from "grammy";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import DbStats from "../db/stats";

async function stats_today(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  dbStats: DbStats,
  active: YAMLWrapper<IActive>
) {
  const stats = await dbStats.chat.today(ctx.chat.id);
  if (!stats || stats === undefined) return;

  await ctx.reply(
    "📊 Статистика чату за сьогодні:\n\n" + getStatsRatingPlusToday(stats, ctx.chat.id, active),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_today;
