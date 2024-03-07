import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import TodayStats from "../data/stats";
import { IDbChatUserStats } from "../types/stats";
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

  const merged = stats.reduce(
    (obj: { [user_id: string]: IDbChatUserStats }, item) => ((obj[item.user_id] = item), obj),
    {}
  );

  let user_id: string;

  for (user_id of Object.keys(todayStats.data[chat_id] || {})) {
    if (merged[user_id]) {
      merged[user_id].count += todayStats.data[chat_id]?.[user_id] || 0;
    } else {
      merged[user_id] ??= {
        user_id: +user_id,
        count: todayStats.data[chat_id]?.[user_id] || 0,
      } as IDbChatUserStats;
    }
  }

  const usersId_sorted = Object.keys(merged).sort((u1, u2) => {
    return merged[u1].count < merged[u2].count ? 1 : -1;
  });

  const statsRowLimit = Math.min(50, usersId_sorted.length);
  let statsRowsCount = 1;

  for (let i = 0; i < usersId_sorted.length + 1; i++) {
    user_id = usersId_sorted[i];
    if (active.data[chat_id]?.[user_id] && statsRowsCount < statsRowLimit + 1) {
      reply += `${statsRowsCount}. ${getUserNameLink.html(
        active.data[chat_id]?.[user_id]?.name || "Невідомо",
        active.data[chat_id]?.[user_id]?.username,
        user_id
      )} — ${merged[user_id].count}\n`;
      statsRowsCount++;
    }

    totalChatMessages += merged[user_id]?.count || 0;
  }
  reply += `\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString("fr-FR")}`;

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
  let user_id: string;

  for (let i = 0; i < Math.min(50, usersId_sorted.length); i++) {
    user_id = usersId_sorted[i];
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
