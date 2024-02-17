"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUserNameLink_1 = __importDefault(require("../utils/getUserNameLink"));
async function stats_today(ctx, yamlStats, active) {
    const stats = yamlStats.data[ctx.chat.id];
    if (!stats || stats === undefined)
        return;
    let reply = "📊 Статистика чату за сьогодні:\n\n";
    let totlal_messages = 0;
    const usersId_sorted = Object.keys(stats).sort((u1, u2) => {
        return stats[u1] < stats[u2] ? 1 : -1;
    });
    for (let i = 0; i < Math.min(50, usersId_sorted.length); i++) {
        const user_id = usersId_sorted[i];
        reply += `${i + 1}\\. ${getUserNameLink_1.default.markdown(active.data[ctx.chat.id]?.[user_id]?.name || "Невідомо", active.data[ctx.chat.id]?.[user_id]?.username, user_id)} — ${stats[user_id] || 0}\n`;
        totlal_messages += stats[user_id] || 0;
    }
    reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;
    ctx.reply(reply, {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
exports.default = stats_today;
