import DbStats from "../db/stats";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type IActive from "../data/active";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { ChatTypeContext, HearsContext } from "grammy";

async function stats_week(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  active: YAMLWrapper<IActive>
) {
  await ctx.reply(
    "📊 Статистика чату за цей тиждень:\n\n" +
      getStatsRatingPlusToday(
        await dbStats.chat.inRage(ctx.chat.id, "weekRange"),
        ctx.chat.id,
        active
      ),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_week;
