import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import type DbStats from "../db/stats";
import type IActive from "../data/active";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { ChatTypeContext, HearsContext } from "grammy";

async function stats_year(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  active: YAMLWrapper<IActive>
) {
  await ctx.reply(
    "📊 Статистика чату за цей рік:\n\n" +
      getStatsRatingPlusToday(
        await dbStats.chat.inRage(ctx.chat.id, "yearRange"),
        ctx.chat.id,
        active
      ),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_year;
