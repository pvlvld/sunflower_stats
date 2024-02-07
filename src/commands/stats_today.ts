import type { MyContext } from "../types/context";
import type { ChatTypeContext } from "grammy";
import getUserNameLink from "../utils/getUserNameLink";
import YAMLStats from "../data/stats";

async function stats_today(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  yamlStats: YAMLStats
) {
  let stats = yamlStats.data[ctx.chat.id];
  if (!stats || stats === undefined) return;

  let reply = "📊 Статистика чату за сьогодні:\n\n";
  let totlal_messages = 0;

  const stats_s = Object.values(stats).sort((a, b) => {
    //@ts-ignore
    return a.messages < b.messages ? 1 : -1;
  }) as any;

  for (let i = 0; i < Math.min(50, stats_s.length); i++) {
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats_s[i].name,
      stats_s[i].username,
      stats_s[i].user_id
    )} — ${stats_s[i].messages || 0}\n`;

    totlal_messages += stats_s[i].messages || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "MarkdownV2",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_today;
