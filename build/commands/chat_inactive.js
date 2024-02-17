"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = __importDefault(require("../utils/escape"));
const parseCmdArgs_1 = __importDefault(require("../utils/parseCmdArgs"));
const PAGE_LENGTH = 25;
function chatInactive_cmd(ctx, active) {
    const page = parseInt((0, parseCmdArgs_1.default)(ctx.msg.text)[0]);
    if (!page)
        return ctx.reply("Введіть номер сторінки.\n!неактив 1");
    ctx.reply(getInactivePageMessage(ctx.chat.id, Math.abs(page), active), {
        parse_mode: "Markdown",
    });
}
function getInactivePageMessage(chat_id, page, active) {
    const inactiveUsers = getInactivePage(chat_id, page, active);
    if (inactiveUsers.length === 0)
        return "Ця сторінка порожня\\.";
    return inactiveUsers
        .map((user, i) => `${i + 1 + (page - 1) * PAGE_LENGTH}\\. ${genUserPageRecord(chat_id, user, active)}`)
        .join("\n");
}
function genUserPageRecord(chat_id, user, active) {
    return `**${escape_1.default.markdownV1(active.data[chat_id]?.[user]?.name || "невідомо")}** — ${escape_1.default.markdownV1(active.data[chat_id]?.[user]?.active_last || "невідомо")}`;
}
function getInactivePage(chat_id, page, active) {
    return getSortedInactive(chat_id, active).slice(PAGE_LENGTH * (page - 1), PAGE_LENGTH * (page - 1) + PAGE_LENGTH);
}
function getSortedInactive(chat_id, active) {
    return Object.keys(active.data?.[chat_id] || {}).sort((u1, u2) => {
        return (active.data?.[chat_id]?.[u1]?.active_last || 0) >
            (active.data?.[chat_id]?.[u2]?.active_last || 0)
            ? 1
            : -1;
    });
}
exports.default = chatInactive_cmd;
