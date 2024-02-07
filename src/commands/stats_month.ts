import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import YAMLStats from "../data/stats";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";

async function stats_month(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  yamlStats: YAMLStats
) {
  const stats = await dbStats.chat.month(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Щось пішло не так.");
    return;
  }

  ctx.reply(
    "📊 Статистика чату за цей місяць:\n\n" +
      getStatsRatingPlusToday(stats, ctx.chat.id, ctx.from.id, yamlStats),
    {
      parse_mode: "MarkdownV2",
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_month;
