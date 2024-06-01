import getUserNameLink from "./getUserNameLink";
import type { IDBChatUserStats } from "../types/stats";
import { active } from "../data/active";

export function getStatsRatingPlusToday(stats: IDBChatUserStats[], chat_id: number) {
  const replyParts: string[] = [];
  let totalChatMessages = 0;

  const statsRowLimit = Math.min(25, stats.length);
  const activeData = active.data[chat_id];

  let statsRowsCount = 0;
  let displayRank = 1;
  let user: IDBChatUserStats;
  let userData: any;
  let nickname = "";

  for (let i = 0; i < stats.length; i++) {
    user = stats[i];
    if (statsRowsCount < statsRowLimit) {
      userData = activeData?.[user.user_id];

      if (userData) {
        nickname = userData.nickname || userData.name || "Невідомо";
        replyParts.push(
          `${displayRank}. ${getUserNameLink.html(nickname, userData.username, user.user_id)} — ${
            user.count || 0
          }\n`
        );
        statsRowsCount++;
        displayRank++;
      }
    }

    totalChatMessages += user.count || 0;
  }

  replyParts.push(`\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString("fr-FR")}`);

  return replyParts.join("");
}
