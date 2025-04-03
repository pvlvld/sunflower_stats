import type { IDBChatUserStatsAll } from "../types/stats.js";
import { active } from "../data/active.js";
import Escape from "./escape.js";
import moment from "moment";
import { getPremiumMarkSpaced } from "./getPremiumMarkSpaced.js";

async function getUserStatsMessage(chat_id: number, user_id: number, dbStats: IDBChatUserStatsAll) {
    const nickname = active.data[chat_id]?.[user_id]?.nickname;

    return Escape.html(`
Статистика${await getPremiumMarkSpaced(user_id)}${
        nickname ? `${nickname} (${active.data[chat_id]?.[user_id]?.name})` : `${active.data[chat_id]?.[user_id]?.name}`
    }
    
📊 Актив: 

- за день: ${(dbStats.today || 0).toLocaleString("fr-FR")}
- за тиждень: ${(dbStats.week || 0).toLocaleString("fr-FR")}
- за місяць: ${(dbStats.month || 0).toLocaleString("fr-FR")}
- за рік: ${(dbStats.year || 0).toLocaleString("fr-FR")}
- за весь час: ${(dbStats.total || 0).toLocaleString("fr-FR")}

📅 Перша поява в чаті: ${`${dbStats.first_seen} (${moment(dbStats.first_seen).fromNow()})`}`);
}

export default getUserStatsMessage;
