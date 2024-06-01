import Escape from "./escape";
import type { IDBChatUserStatsPeriods } from "../types/stats";
import moment from "moment";
import { active } from "../data/active";

function getUserStatsMessage(chat_id: number, user_id: number, dbStats: IDBChatUserStatsPeriods) {
  const nickname = active.data[chat_id]?.[user_id]?.nickname;

  return Escape.html(`
❄️ Статистика ${
    nickname
      ? `${nickname} (${active.data[chat_id]?.[user_id]?.name})`
      : `${active.data[chat_id]?.[user_id]?.name}`
  }
    
📊 Актив: 

- за день: ${dbStats.today}
- за тиждень: ${dbStats.week}
- за місяць: ${dbStats.month}
- за рік: ${dbStats.year}
- за весь час: ${dbStats.total}

📅 Перша поява в чаті: ${
    active.data[chat_id]?.[user_id]?.active_first
      ? `${active.data[chat_id]?.[user_id]?.active_first} (${moment(
          active.data[chat_id]?.[user_id]?.active_first
        ).fromNow()})`
      : "невідомо"
  }`);
}

export default getUserStatsMessage;
