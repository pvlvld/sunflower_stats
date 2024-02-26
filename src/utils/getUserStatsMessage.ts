import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { IDbChatUserStatsPeriods } from "../types/stats";
import Escape from "./escape";

function getUserStatsMessage(
  chat_id: number,
  user_id: number,
  dbStats: IDbChatUserStatsPeriods,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const stats_today = todayStats.data[chat_id]?.[user_id] || 0;

  const nickname = active.data[chat_id]?.[user_id]?.nickname;

  return Escape.html(`
❄️ Статистика ${
    nickname
      ? `${nickname} (${active.data[chat_id]?.[user_id]?.name})`
      : `${active.data[chat_id]?.[user_id]?.name}`
  }
    
📊 Актив: 

- за день: ${stats_today}
- за тиждень: ${dbStats.week + stats_today}
- за місяць: ${dbStats.month + stats_today}
- за рік: ${dbStats.year + stats_today}
- за весь час: ${dbStats.total + stats_today}

📅 Перша поява в чаті: ${
    active.data[chat_id]?.[user_id]?.active_first || "невідомо"
  }`);
}

export default getUserStatsMessage;
