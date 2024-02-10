import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import YAMLStats from "../data/stats";
import { IDbChatUserStats, IStats } from "../types/stats";
import getUserNameLink from "./getUserNameLink";

export function getStatsRatingPlusToday(
  stats: IDbChatUserStats[],
  chat_id: number,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  let reply = "";
  let totalChatMessages = 0;

  let user_count = 0;
  for (let i = 0; i < stats.length; i++) {
    const totalUserMessages =
      (stats[i].count || 0) +
      (yamlStats.data[chat_id]?.[stats[i].user_id] || 0);
    totalChatMessages += totalUserMessages;

    if (user_count >= 50) continue;
    if (!active.data[chat_id]?.[stats[i].user_id]) {
      continue;
    }
    user_count++;

    reply += `${user_count}. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${totalUserMessages.toLocaleString("fr-FR")}\n`;
  }

  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString(
    "fr-FR"
  )}`;

  return reply;
}
