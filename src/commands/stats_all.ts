import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import YAMLStats from "../data/stats";
import IActive from "../data/active";
import YAMLWrapper from "../data/YAMLWrapper";

async function stats_all(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  const stats = await dbStats.chat.all(ctx.chat.id);
  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Щось пішло не так.");
    return;
  }

  ctx.reply(
    "📊 Статистика чату за весь час:\n\n" +
      getStatsRatingPlusToday(stats, ctx.chat.id, yamlStats, active),
    {
      parse_mode: "HTML",
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_all;
