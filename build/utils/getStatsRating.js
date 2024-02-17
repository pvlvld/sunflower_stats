"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsRatingPlusToday = void 0;
const getUserNameLink_1 = __importDefault(require("./getUserNameLink"));
function getStatsRatingPlusToday(stats, chat_id, yamlStats, active) {
    let reply = "";
    let totalChatMessages = 0;
    let user_count = 0;
    for (let i = 0; i < stats.length; i++) {
        const totalUserMessages = (stats[i].count || 0) +
            (yamlStats.data[chat_id]?.[stats[i].user_id] || 0);
        totalChatMessages += totalUserMessages;
        if (user_count >= 50)
            continue;
        if (!active.data[chat_id]?.[stats[i].user_id]) {
            continue;
        }
        user_count++;
        console.log(stats[i]);
        reply += `${user_count}. ${getUserNameLink_1.default.markdown(active.data[chat_id]?.[stats[i].user_id]?.nickname || stats[i].name, stats[i].username, stats[i].user_id)} — ${totalUserMessages.toLocaleString("fr-FR")}\n`;
    }
    reply += `\nЗагальна кількість повідомлень: ${totalChatMessages.toLocaleString("fr-FR")}`;
    return reply;
}
exports.getStatsRatingPlusToday = getStatsRatingPlusToday;
