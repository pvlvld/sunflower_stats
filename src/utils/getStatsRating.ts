import YAMLStats from "../data/stats";
import { IDbChatUserStats, IStats } from "../types/stats";
import getUserNameLink from "./getUserNameLink";

export function getStatsRatingPlusToday(
  stats: IDbChatUserStats[],
  chat_id: number,
  yamlStats: YAMLStats
) {
  let reply = "";
  let totalChatMessages = 0;

  for (let i = 0; i < Math.min(50, stats.length); i++) {
    const totalUserMessages =
      (stats[i].count || 0) +
      (yamlStats.data[chat_id]?.[stats[i].user_id] || 0);

    reply += `${i + 1}. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${totalUserMessages}\n`;

    totalChatMessages += totalUserMessages;
  }

  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages}`;

  return reply;
}
