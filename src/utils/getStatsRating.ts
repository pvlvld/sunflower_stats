import YAMLStats from "../data/stats";
import { IDbChatUserStats, IStats } from "../types/stats";
import addTodayUserMessages from "./addTodayUserMessages";
import getUserNameLink from "./getUserNameLink";

export function getStatsRating(stats: any) {
  let reply = "";
  let totalChatMessages = 0;

  for (let i = 0; i < Math.min(50, stats.length); i++) {
    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${stats[i].messages || 0}\n`;

    totalChatMessages += stats[i].day || 0;
  }

  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages}`;

  return reply;
}

// Separate function to reduce ticks due to infrequent use of db stats without adding today stats
export function getStatsRatingPlusToday(
  stats: IDbChatUserStats[],
  chat_id: number,
  user_id: number,
  yamlStats: YAMLStats
) {
  let reply = "";
  let totalChatMessages = 0;

  for (let i = 0; i < Math.min(50, stats.length); i++) {
    const totalUserMessages = addTodayUserMessages(
      chat_id,
      user_id,
      stats[i].count || 0,
      yamlStats
    );

    reply += `${i + 1}\\. ${getUserNameLink.markdown(
      stats[i].name,
      stats[i].username,
      stats[i].user_id
    )} — ${totalUserMessages}\n`;

    totalChatMessages += totalUserMessages;
  }

  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages}`;

  return reply;
}
