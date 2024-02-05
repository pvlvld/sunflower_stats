import type { MyContext } from "../types/context";
import type { ChatTypeContext } from "grammy";
import getUserNameLink from "../utils/getUserNameLink";
import yamlStats from "../data/stats";

async function stats_today(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">
) {
  const stats = yamlStats.data?.[ctx.chat.id];

  let reply = "📊 Статистика чату за сьогодні:\n\n";
  let totlal_messages = 0;
  let members_in_stats = 0;

  for (const key in stats) {
    if (members_in_stats >= 50) break;
    members_in_stats++;

    reply += `${members_in_stats}\\. ${getUserNameLink.markdown(
      stats[key]?.name as string,
      stats[key]?.username,
      key
    )} — ${stats[key]?.all}\n`;

    totlal_messages += stats[key]?.all || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "MarkdownV2",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_today;
