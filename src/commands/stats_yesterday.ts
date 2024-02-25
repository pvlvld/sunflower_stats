import { ChatTypeContext } from "grammy";
import DbStats from "../db/stats";
import { MyContext } from "../types/context";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import getUserNameLink from "../utils/getUserNameLink";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function stats_yestarday(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  dbStats: DbStats,
  active: YAMLWrapper<IActive>
) {
  const stats = await dbStats.chat.yesterday(ctx.chat.id);

  if (!isDbResNotEmpty(stats)) {
    await ctx.reply("Статистика за вчора відсутня.");
    return;
  }

  let reply = "📊 Статистика чату за вчора:\n\n";
  let total_messages: number = 0;

  for (let i = 0; i < Math.min(100, stats?.length || 100); i++) {
    reply += `${i + 1}. ${getUserNameLink.html(
      active.data[ctx.chat.id]?.[stats[i].user_id]?.nickname ||
        active.data[ctx.chat.id]?.[stats[i].user_id]?.name ||
        stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${stats[i].count}\n`;

    total_messages += stats[i].count;
  }

  reply += `\nЗагальна кількість повідомлень: ${total_messages}`;

  await ctx.reply(reply, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_yestarday;
