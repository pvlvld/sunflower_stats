import type { IDBChatUserStatsAll } from "../types/stats.js";
import { IActiveUser } from "../redis/active.js";
import Escape from "./escape.js";
import moment from "moment";
import { getPremiumMarkSpaced } from "./getPremiumMarkSpaced.js";
import { IGroupContext } from "../types/context.js";

async function getUserStatsMessage(
    ctx: IGroupContext,
    user_id: number,
    userStats: IDBChatUserStatsAll,
    userActive: IActiveUser | null
) {
    const firstSeen = moment(userStats.first_seen).locale(await ctx.i18n.getLocale());

    return ctx.t("stats-user-message", {
        name: `${await getPremiumMarkSpaced(user_id)}${Escape.html(
            userActive?.nickname ? `${userActive.nickname} (${userActive?.name})` : `${userActive?.name}`
        )}`,
        today: (userStats.today || 0).toLocaleString("fr-FR"),
        week: (userStats.week || 0).toLocaleString("fr-FR"),
        month: (userStats.month || 0).toLocaleString("fr-FR"),
        year: (userStats.year || 0).toLocaleString("fr-FR"),
        total: (userStats.total || 0).toLocaleString("fr-FR"),
        firstSeen: `${userStats.first_seen} (${firstSeen.fromNow()})`,
    });
}

export default getUserStatsMessage;
