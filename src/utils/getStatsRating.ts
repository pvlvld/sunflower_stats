import type { IDBChatUserStats } from "../types/stats.js";
import getUserNameLink from "./getUserNameLink.js";
import { active, IActiveUser } from "../data/active.js";
import { IChatSettings } from "../types/settings.js";

export function getStatsRatingPlusToday(
  stats: IDBChatUserStats[],
  chat_id: number,
  settings: IChatSettings,
  type?: "caption" | "text"
) {
  const replyParts: string[] = [];
  let totalChatMessages = 0;

  const statsRowLimit = Math.min(type === "text" ? 50 : 25, stats.length);
  const activeData = active.data[chat_id];

  let statsRowsCount = 0;
  let displayRank = 1;
  let user: IDBChatUserStats;
  let userData: IActiveUser | undefined;
  let nickname = "";

  for (let i = 0; i < stats.length; i++) {
    user = stats[i];
    if (statsRowsCount < statsRowLimit) {
      userData = activeData?.[user.user_id];

      if (userData) {
        replyParts.push(
          `${displayRank}. ${getUserNameString(settings, userData, user.user_id)} — ${(
            user.count || 0
          ).toLocaleString("fr-FR")}\n`
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

function getUserNameString(settings: IChatSettings, userData: IActiveUser, user_id: number) {
  if (settings.userstatslink) {
    return getUserNameLink.html(
      userData.nickname || userData.name || "Невідомо",
      userData.username,
      user_id
    );
  } else {
    if (userData.nickname) {
      return `${userData.nickname} (${userData.name})`;
    } else {
      return userData.name;
    }
  }
}
