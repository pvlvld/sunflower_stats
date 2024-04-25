import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type { ChatTypeContext } from "grammy";
import type { MyContext } from "../types/context";
import dbStats from "../db/stats";

async function stats_today(ctx: ChatTypeContext<MyContext, "supergroup" | "group">) {
  const stats = await dbStats.chat.today(ctx.chat.id);
  if (!stats || stats === undefined) return;

  await ctx.reply(
    "📊 Статистика чату за сьогодні:\n\n" + getStatsRatingPlusToday(stats, ctx.chat.id),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_today;
