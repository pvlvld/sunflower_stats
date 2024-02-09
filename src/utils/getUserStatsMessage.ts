import { User } from "@grammyjs/types";
import YAMLStats from "../data/stats";
import escapeMarkdownV2 from "./escapeMarkdownV2";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { IUserDbStats } from "../types/stats";

function getUserStatsMessage(
  chat_id: number,
  user: User,
  dbStats: IUserDbStats,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  const stats_today = yamlStats.data[chat_id]?.[user.id] || 0;

  return escapeMarkdownV2(`
❄️ Статистика ${user.first_name}
    
📊 Актив: 

- за день: ${stats_today}
- за тиждень: ${dbStats.week + stats_today}
- за місяць: ${dbStats.month + stats_today}
- за рік: ${dbStats.year + stats_today}
- за весь час: ${dbStats.total + stats_today}

📅 Перша поява в чаті: ${
    active.data[chat_id]?.[user.id]?.active_first || "невідомо"
  }`);
}

export default getUserStatsMessage;
