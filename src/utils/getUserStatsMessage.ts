import type { IDBChatUserStatsPeriods } from "../types/stats.js";
import { active } from "../data/active.js";
import Escape from "./escape.js";
import moment from "moment";

function getUserStatsMessage(chat_id: number, user_id: number, dbStats: IDBChatUserStatsPeriods) {
  const nickname = active.data[chat_id]?.[user_id]?.nickname;

  return Escape.html(`
❄️ Статистика ${
    nickname
      ? `${nickname} (${active.data[chat_id]?.[user_id]?.name})`
      : `${active.data[chat_id]?.[user_id]?.name}`
  }
    
📊 Актив: 

- за день: ${(dbStats.today || 0).toLocaleString("fr-FR")}
- за тиждень: ${(dbStats.week || 0).toLocaleString("fr-FR")}
- за місяць: ${(dbStats.month || 0).toLocaleString("fr-FR")}
- за рік: ${(dbStats.year || 0).toLocaleString("fr-FR")}
- за весь час: ${(dbStats.total || 0).toLocaleString("fr-FR")}

📅 Перша поява в чаті: ${
    active.data[chat_id]?.[user_id]?.active_first
      ? `${active.data[chat_id]?.[user_id]?.active_first} (${moment(
          active.data[chat_id]?.[user_id]?.active_first
        ).fromNow()})`
      : "невідомо"
  }`);
}

export default getUserStatsMessage;
