import type { IDBChatUserStatsAndTotal } from "../types/stats.js";
import getUserNameLink from "./getUserNameLink.js";
import { active, IActiveUser } from "../data/active.js";
import { IChatSettings } from "../types/settings.js";
import { IDateRange } from "../commands/stats_chat.js";

export function getStatsChatRating(
    stats: IDBChatUserStatsAndTotal[],
    chat_id: number,
    settings: IChatSettings,
    page: number,
    dateRange: IDateRange | "date",
    type: "caption" | "text"
) {
    const replyParts: string[] = [];

    const statsRowLimit = Math.min(type === "text" ? 50 : 25, stats.length);
    const activeData = active.data[chat_id];

    let statsRowsCount = 0;
    const offset = statsRowLimit * page - statsRowLimit;
    let displayRank = page === 1 ? 1 : offset + 1;
    let user: IDBChatUserStatsAndTotal;
    let userData: IActiveUser | undefined;
    let validUsersCount = 0;

    for (let i = 0; i < stats.length; i++) {
        user = stats[i];
        if (statsRowsCount < statsRowLimit) {
            userData = activeData?.[user.user_id];

            if (!userData) continue;
            validUsersCount++;
            if (validUsersCount > offset) {
                replyParts.push(
                    `${displayRank}. ${getUserNameString(settings, userData, user.user_id)} — ${(
                        user.count || 0
                    ).toLocaleString("fr-FR")}\n`
                );
                statsRowsCount++;
                displayRank++;
            }
        }
    }

    replyParts.push(
        `\nЗагальна кількість повідомлень<a href="${encodeStatsMetadata(
            chat_id,
            stats,
            statsRowLimit,
            dateRange,
            page
        )}">:</a> ${stats[0].total_count.toLocaleString("fr-FR")}`
    );
    return replyParts.join("");
}

function getUserNameString(settings: IChatSettings, userData: IActiveUser, user_id: number) {
    if (settings.userstatslink) {
        return getUserNameLink.html(userData.nickname || userData.name || "Невідомо", userData.username, user_id);
    } else {
        if (userData.nickname) {
            return `${userData.nickname} (${userData.name})`;
        } else {
            return userData.name;
        }
    }
}

function encodeStatsMetadata(
    chat_id: number,
    stats: IDBChatUserStatsAndTotal[],
    statsRowLimit: number,
    dateRange: IDateRange | "date",
    page: number
) {
    return `t.me/meta?u=${getStatsUsersCount(chat_id, stats)}?l=${statsRowLimit}?r=${dateRange}?p=${page}`;
}

function getStatsUsersCount(chat_id: number, stats: IDBChatUserStatsAndTotal[]) {
    let user: IDBChatUserStatsAndTotal;
    let activeData = active.data[chat_id];
    let counter = 0;
    for (user of stats) {
        if (activeData?.[user.user_id]) {
            counter++;
        }
    }
    return counter;
}
