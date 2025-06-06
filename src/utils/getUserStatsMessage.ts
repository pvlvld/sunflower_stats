import type { IDBChatUserStatsAll } from "../types/stats.js";
import { IActiveUser } from "../redis/active.js";
import Escape from "./escape.js";
import moment from "moment";
import { getPremiumMarkSpaced } from "./getPremiumMarkSpaced.js";

async function getUserStatsMessage(user_id: number, userStats: IDBChatUserStatsAll, userActive: IActiveUser | null) {
    return Escape.html(`
Статистика${await getPremiumMarkSpaced(user_id)}${
        userActive?.nickname ? `${userActive.nickname} (${userActive?.name})` : `${userActive?.name}`
    }
    
📊 Актив: 

- за день: ${(userStats.today || 0).toLocaleString("fr-FR")}
- за тиждень: ${(userStats.week || 0).toLocaleString("fr-FR")}
- за місяць: ${(userStats.month || 0).toLocaleString("fr-FR")}
- за рік: ${(userStats.year || 0).toLocaleString("fr-FR")}
- за весь час: ${(userStats.total || 0).toLocaleString("fr-FR")}

📅 Перша поява в чаті: ${`${userStats.first_seen} (${moment(userStats.first_seen).fromNow()})`}`);
}

export default getUserStatsMessage;
