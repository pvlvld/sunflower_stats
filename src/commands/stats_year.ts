import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import YAMLStats from "../data/stats";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function stats_year(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  const stats = await dbStats.chat.year(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Щось пішло не так.");
    return;
  }

  ctx.reply(
    "📊 Статистика чату за цей рік:\n\n" +
      getStatsRatingPlusToday(stats, ctx.chat.id, yamlStats, active),
    {
      parse_mode: "Markdown",
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_year;
