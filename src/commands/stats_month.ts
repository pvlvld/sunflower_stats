import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import dbStats from "../db/stats";

async function stats_month(ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>) {
  await ctx.reply(
    "📊 Статистика чату за цей місяць:\n\n" +
      getStatsRatingPlusToday(await dbStats.chat.inRage(ctx.chat.id, "monthRange"), ctx.chat.id),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_month;
