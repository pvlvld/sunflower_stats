"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isDbResNotEmpty_1 = __importDefault(require("../utils/isDbResNotEmpty"));
const getStatsRating_1 = require("../utils/getStatsRating");
async function stats_week(ctx, dbStats, yamlStats, active) {
    const stats = await dbStats.chat.week(ctx.chat.id);
    if (!(0, isDbResNotEmpty_1.default)(stats)) {
        ctx.reply("Щось пішло не так.");
        return;
    }
    ctx.reply("📊 Статистика чату за цей тиждень:\n\n" +
        (0, getStatsRating_1.getStatsRatingPlusToday)(stats, ctx.chat.id, yamlStats, active), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
exports.default = stats_week;
