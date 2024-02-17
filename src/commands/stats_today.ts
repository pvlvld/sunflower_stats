import type { MyContext } from "../types/context";
import type { ChatTypeContext } from "grammy";
import getUserNameLink from "../utils/getUserNameLink";
import YAMLStats from "../data/stats";
import IActive from "../data/active";
import YAMLWrapper from "../data/YAMLWrapper";

async function stats_today(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  const stats = yamlStats.data[ctx.chat.id];
  if (!stats || stats === undefined) return;

  let reply = "📊 Статистика чату за сьогодні:\n\n";
  let totlal_messages = 0;

  const usersId_sorted = Object.keys(stats).sort((u1, u2) => {
    //@ts-expect-error
    return stats[u1] < stats[u2] ? 1 : -1;
  });

  for (let i = 0; i < Math.min(50, usersId_sorted.length); i++) {
    const user_id = usersId_sorted[i];
    reply += `${i + 1}. ${getUserNameLink.html(
      active.data[ctx.chat.id]?.[user_id]?.nickname ||
        active.data[ctx.chat.id]?.[user_id]?.name ||
        "Невідомо",
      active.data[ctx.chat.id]?.[user_id]?.username,
      user_id
    )} — ${stats[user_id] || 0}\n`;

    totlal_messages += stats[user_id] || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "HTML",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_today;
