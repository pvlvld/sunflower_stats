"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = __importDefault(require("./escape"));
function getUserStatsMessage(chat_id, user, dbStats, yamlStats, active) {
    const stats_today = yamlStats.data[chat_id]?.[user.id] || 0;
    return escape_1.default.markdownV1(`
❄️ Статистика ${user.first_name}
    
📊 Актив: 

- за день: ${stats_today}
- за тиждень: ${dbStats.week + stats_today}
- за місяць: ${dbStats.month + stats_today}
- за рік: ${dbStats.year + stats_today}
- за весь час: ${dbStats.total + stats_today}

📅 Перша поява в чаті: ${active.data[chat_id]?.[user.id]?.active_first || "невідомо"}`);
}
exports.default = getUserStatsMessage;
