import type { IDBChatUserStatsAndTotal } from "../types/stats.js";
import getUserNameLink from "./getUserNameLink.js";
import { IDateRange } from "../commands/stats_chat.js";
import { active, IActiveUser } from "../redis/active.js";
import Escape from "./escape.js";
import { IChatSettings } from "../consts/defaultChatSettings.js";
import { getPremiumMarkSpaced } from "./getPremiumMarkSpaced.js";
import { i18n } from "../bot.js";
import { LocaleService } from "../cache/localeService.js";

export async function getStatsChatRating(
    chat_id: number,
    stats: IDBChatUserStatsAndTotal[],
    activeUsers: Awaited<ReturnType<typeof active.getChatUsers>>,
    settings: IChatSettings,
    page: number,
    dateRange: IDateRange | "date",
    type: "caption" | "text"
) {
    const replyParts: string[] = [];

    const statsRowLimit = Math.min(type === "text" ? 50 : 25, stats.length);

    let statsRowsCount = 0;
    const offset = statsRowLimit * page - statsRowLimit;
    let displayRank = page === 1 ? 1 : offset + 1;
    let user: IDBChatUserStatsAndTotal;
    let userData: IActiveUser | undefined;
    let validUsersCount = 0;
    const locale = await LocaleService.get(chat_id);
    for (let i = 0; i < stats.length; i++) {
        user = stats[i];
        userData = activeUsers?.[user.user_id];
        if (!userData) continue;
        validUsersCount++;

        if (statsRowsCount < statsRowLimit) {
            if (validUsersCount > offset) {
                replyParts.push(
                    `${displayRank}. ${await getPremiumMarkSpaced(user.user_id)}${getUserNameString(
                        ctx,
                        settings,
                        userData,
                        user.user_id
                    )} — ${(user.count || 0).toLocaleString("fr-FR")}\n`
                );
                statsRowsCount++;
                displayRank++;
            }
        }
    }

    replyParts.push(
        `\n${i18n.t(locale, "stats-total-amount")}<a href="${encodeStatsMetadata(
            validUsersCount,
            statsRowLimit,
            dateRange,
            page
        )}">:</a> ${(+stats[0].total_count).toLocaleString("fr-FR")}`
    );
    return replyParts.join("");
}

async function getUserNameString(chat_id: number, settings: IChatSettings, userData: IActiveUser, user_id: number) {
    let result = "";

    if (settings.userstatslink) {
        result = getUserNameLink.html(
            userData.nickname || userData.name || i18n.t(await LocaleService.get(chat_id), "unknown"),
            userData.username,
            user_id
        );
    } else {
        if (userData.nickname) {
            result = `${userData.nickname} (${Escape.html(userData.name)})`;
        } else {
            result = Escape.html(userData.name);
        }
    }

    return result;
}

function encodeStatsMetadata(
    validUsersCount: number,
    statsRowLimit: number,
    dateRange: IDateRange | "date",
    page: number
) {
    return `t.me/meta?u=${validUsersCount}?l=${statsRowLimit}?r=${dateRange}?p=${page}`;
}
