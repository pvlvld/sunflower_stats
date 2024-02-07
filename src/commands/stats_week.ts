import type { MyContext } from "../types/context";
import type { ChatTypeContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import getUserNameLink from "../utils/getUserNameLink";

async function stats_week(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  dbStats: DbStats
) {
  const stats = await dbStats.chat.week(ctx.chat.id);
  // TODO: adding today stats from yaml
  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Щось пішло не так.");
    return;
  }

  let reply = "📊 Статистика чату за цей тиждень:\n\n";
  let totlal_messages = 0;

  for (let i = 0; i < Math.min(50, stats.length); i++) {
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${stats[i].count || 0}\n`;

    totlal_messages += stats[i].count || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "MarkdownV2",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_week;
