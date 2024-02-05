import type { MyContext } from "../types/context";
import type { ChatTypeContext } from "grammy";
import DbStats from "../db/stats";
import isDbResNotEmpty from "../utils/isDbResNotEmpty";
import getUserNameLink from "../utils/getUserNameLink";

async function stats_month(
  ctx: ChatTypeContext<MyContext, "supergroup" | "group">,
  dbStats: DbStats
) {
  const stats = await dbStats.chat.month(ctx.chat.id);

  if (!isDbResNotEmpty(stats)) {
    ctx.reply("Щось пішло не так.");
    return;
  }

  let reply = "📊 Статистика чату за цей місяць:\n\n";
  let totlal_messages = 0;
  let stats_s = [] as any[],
    b;

  for (b in stats) {
    stats_s.push({ ...stats[b], user_id: b });
  }

  stats_s = stats_s.sort((a, b) => {
    return a.count < b.count ? 1 : -1;
  });

  for (let i = 0; i < Math.min(50, stats_s.length); i++) {
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats_s[i].name,
      stats_s[i].username,
      stats_s[i].user_id
    )} — ${stats_s[i].count || 0}\n`;

    totlal_messages += stats_s[i].count || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;

  ctx.reply(reply, {
    parse_mode: "MarkdownV2",
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default stats_month;
