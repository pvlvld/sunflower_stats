"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getUserStatsMessage_1 = __importDefault(require("../utils/getUserStatsMessage"));
async function stats_my(ctx, dbStats, yamlStats, active) {
    ctx.reply((0, getUserStatsMessage_1.default)(ctx.chat.id, ctx.from, await dbStats.user.all(ctx.chat.id, ctx.from.id), yamlStats, active), {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
exports.default = stats_my;
