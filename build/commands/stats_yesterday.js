"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isDbResNotEmpty_1 = __importDefault(require("../utils/isDbResNotEmpty"));
const getUserNameLink_1 = __importDefault(require("../utils/getUserNameLink"));
async function stats_yestarday(ctx, dbStats) {
    const stats = await dbStats.chat.yesterday(ctx.chat.id);
    if (!(0, isDbResNotEmpty_1.default)(stats)) {
        ctx.reply("Статистика за вчора відсутня.");
        return;
    }
    let reply = "📊 Статистика чату за вчора:\n\n";
    let totlal_messages = 0;
    for (let i = 0; i < Math.min(100, stats?.length || 100); i++) {
        reply += `${i + 1}\\. ${getUserNameLink_1.default.markdown(stats[i].name, stats[i].username, stats[i].user_id)} — ${stats[i].count}\n`;
        totlal_messages += stats[i].count;
    }
    reply += `\nЗагальна кількість повідомлень: ${totlal_messages}`;
    ctx.reply(reply, {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
exports.default = stats_yestarday;
