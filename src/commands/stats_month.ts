import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import getUserNameLink from "../utils/getUserNameLink";
import YAMLStats from "../data/stats";
import addTodayUserMessages from "../utils/addTodayUserMessages";

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

  let reply = "📊 Статистика чату за цей місяць:\n\n";
  let totlal_messages = 0;

  for (let i = 0; i < Math.min(50, stats.length); i++) {
    const totalUserMessages = addTodayUserMessages(
      ctx.chat.id,
      ctx.from.id,
      stats[i].count || 0,
      yamlStats
    );
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${totalUserMessages}\n`;

    totlal_messages += totalUserMessages;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "MarkdownV2",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_month;
