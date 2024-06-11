import Escape from "./escape";
import type { IDBChatUserStatsPeriods } from "../types/stats";
import moment from "moment";
import { active } from "../data/active";

// TODO: do not add wider period if msg count same as previous = user in chat less that next period

function getUserStatsMessage(chat_id: number, user_id: number, dbStats: IDBChatUserStatsPeriods) {
  const nickname = active.data[chat_id]?.[user_id]?.nickname;

  return Escape.html(`
❄️ Статистика ${
    nickname
      ? `${nickname} (${active.data[chat_id]?.[user_id]?.name})`
      : `${active.data[chat_id]?.[user_id]?.name}`
  }
    
📊 Актив: 

- за день: ${dbStats.today || 0}
- за тиждень: ${dbStats.week || 0}
- за місяць: ${dbStats.month || 0}
- за рік: ${dbStats.year || 0}
- за весь час: ${dbStats.total || 0}

📅 Перша поява в чаті: ${
    active.data[chat_id]?.[user_id]?.active_first
      ? `${active.data[chat_id]?.[user_id]?.active_first} (${moment(
          active.data[chat_id]?.[user_id]?.active_first
        ).fromNow()})`
      : "невідомо"
  }`);
}

export default getUserStatsMessage;
