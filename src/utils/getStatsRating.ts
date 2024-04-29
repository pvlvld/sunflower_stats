import getUserNameLink from "./getUserNameLink";
import type { IDbChatUserStats } from "../types/stats";
import { active } from "../data/active";

export function getStatsRatingPlusToday(stats: IDbChatUserStats[], chat_id: number) {
  const replyParts: string[] = [];
  let totalChatMessages = 0;

  const statsRowLimit = Math.min(50, stats.length);
  let statsRowsCount = 1;

  let user: IDbChatUserStats;
  for (user of stats) {
    if (active.data[chat_id]?.[user.user_id] && statsRowsCount < statsRowLimit + 1) {
      replyParts.push(
        `${statsRowsCount}. ${getUserNameLink.html(
          active.data[chat_id]?.[user.user_id]?.nickname ||
            active.data[chat_id]?.[user.user_id]?.name ||
            "Невідомо",
          active.data[chat_id]?.[user.user_id]?.username,
          user.user_id
        )} — ${user.count || 0}\n`
      );
      statsRowsCount++;
    }
    totalChatMessages += user.count || 0;
  }

  replyParts.push(`\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString("fr-FR")}`);

  return replyParts.join("");
}
