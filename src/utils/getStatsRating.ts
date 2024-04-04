import getUserNameLink from "./getUserNameLink";
import type IActive from "../data/active";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { IDbChatUserStats } from "../types/stats";

export function getStatsRatingPlusToday(
  stats: IDbChatUserStats[],
  chat_id: number,
  active: YAMLWrapper<IActive>
) {
  const replyParts: string[] = [];
  let totalChatMessages = 0;

  const merged: { [user_id: string]: IDbChatUserStats } = {};
  for (const item of stats) {
    merged[item.user_id] = item;
  }

  let user_id: string;

  const usersId_sorted = Object.keys(merged).sort((u1, u2) => {
    return merged[u1].count < merged[u2].count ? 1 : -1;
  });

  const statsRowLimit = Math.min(50, usersId_sorted.length);
  let statsRowsCount = 1;

  for (let i = 0; i < usersId_sorted.length + 1; i++) {
    user_id = usersId_sorted[i];
    if (active.data[chat_id]?.[user_id] && statsRowsCount < statsRowLimit + 1) {
      replyParts.push(
        `${statsRowsCount}. ${getUserNameLink.html(
          active.data[chat_id]?.[user_id]?.nickname ||
            active.data[chat_id]?.[user_id]?.name ||
            "Невідомо",
          active.data[chat_id]?.[user_id]?.username,
          user_id
        )} — ${merged[user_id].count}\n`
      );
      statsRowsCount++;
    }

    totalChatMessages += merged[user_id]?.count || 0;
  }
  replyParts.push(`\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString("fr-FR")}`);

  return replyParts.join("");
}
