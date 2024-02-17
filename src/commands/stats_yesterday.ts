import { ChatTypeContext, Filter } from "grammy";
import DbStats from "../db/stats";
import { MyContext } from "../types/context";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import getUserNameLink from "../utils/getUserNameLink";

async function stats_yestarday(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  dbStats: DbStats
) {
  const stats = await dbStats.chat.yesterday(ctx.chat.id);

  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Статистика за вчора відсутня.");
    return;
  }

  let reply = "📊 Статистика чату за вчора:\n\n";
  let totlal_messages = 0;

  for (let i = 0; i < Math.min(100, stats?.length || 100); i++) {
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${stats[i].count}\n`;

    totlal_messages += stats[i].count;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "HTML",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_yestarday;
