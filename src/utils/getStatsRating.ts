import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import TodayStats from "../data/stats";
import { IDbChatUserStats, IStats } from "../types/stats";
import getUserNameLink from "./getUserNameLink";

export function getStatsRatingPlusToday(
  stats: IDbChatUserStats[],
  chat_id: number,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  if (stats.length === 0) {
    return getStatsRatingToday(chat_id, todayStats, active);
  }

  let reply = "";
  let totalChatMessages = 0;

  let user_count = 0;

  const chatMembersStats = { ...todayStats.data[chat_id]! };

  for (const user of stats) {
    if (chatMembersStats[user.user_id] && stats[user.user_id]) {
      stats[user.user_id].count += chatMembersStats[user.user_id] || 0;
      delete chatMembersStats[user.user_id];
    }
  }

  for (const user_id in chatMembersStats) {
    stats.push({
      user_id: +user_id,
      name: active.data[chat_id]?.[user_id]?.name || "Невідомо",
      username: active.data[chat_id]?.[user_id]?.username || null,
      count: chatMembersStats[user_id] ?? 0,
    });
  }

  stats.sort((a, b) => {
    return a.count < b.count ? 1 : -1;
  });

  for (let i = 0; i < stats.length; i++) {
    const totalUserMessages = stats[i].count || 0;
    totalChatMessages += totalUserMessages;

    if (user_count >= 50) continue;
    if (!active.data[chat_id]?.[stats[i].user_id]) {
      continue;
    }
    user_count++;
    reply += `${user_count}. ${getUserNameLink.html(
      active.data[chat_id]?.[stats[i].user_id]?.nickname ||
        active.data[chat_id]?.[stats[i].user_id]?.name ||
        stats[i].name,
      active.data[chat_id]?.[stats[i].user_id]?.username,
      stats[i].user_id
    )} — ${totalUserMessages.toLocaleString("fr-FR")}\n`;
  }

  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString(
    "fr-FR"
  )}`;

  return reply;
}

export function getStatsRatingToday(
  chat_id: number,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const stats = todayStats.data[chat_id];
  if (!stats || stats === undefined) return;

  let totlal_messages = 0;

  const usersId_sorted = Object.keys(stats).sort((u1, u2) => {
    //@ts-expect-error
    return stats[u1] < stats[u2] ? 1 : -1;
  });

  let reply = "";

  for (let i = 0; i < Math.min(50, usersId_sorted.length); i++) {
    const user_id = usersId_sorted[i];
    reply += `${i + 1}. ${getUserNameLink.html(
      active.data[chat_id]?.[user_id]?.nickname ||
        active.data[chat_id]?.[user_id]?.name ||
        "Невідомо",
      active.data[chat_id]?.[user_id]?.username,
      user_id
    )} — ${stats[user_id] || 0}\n`;

    totlal_messages += stats[user_id] || 0;
  }

  return (reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`);
}
