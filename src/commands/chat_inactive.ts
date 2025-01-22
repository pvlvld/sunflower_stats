import type { IGroupTextContext } from "../types/context.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { active } from "../data/active.js";

const PAGE_LENGTH = 25;

async function chatInactive_cmd(ctx: IGroupTextContext) {
    const page = parseInt(parseCmdArgs(ctx.msg.text ?? ctx.msg.caption)[0] ?? "");
    if (!page) {
        await ctx.reply("Введіть номер сторінки.\n!неактив 1");
        return;
    }

    await ctx.reply(getInactivePageMessage(ctx.chat.id, Math.abs(page)), {
        link_preview_options: { is_disabled: true },
        disable_notification: true,
    });
}

function getInactivePageMessage(chat_id: number, page: number) {
    const inactiveUsers = getInactivePage(chat_id, page);
    if (inactiveUsers.length === 0) return "Ця сторінка порожня.";

    return inactiveUsers
        .map((user, i) => `${i + 1 + (page - 1) * PAGE_LENGTH}. ${genUserPageRecord(chat_id, user)}`)
        .join("\n");
}

function genUserPageRecord(chat_id: number, user: string) {
    return `<b>${getUserNameLink.html(
        active.data[chat_id]?.[user]?.nickname || active.data[chat_id]?.[user]?.name || "невідомо",
        active.data[chat_id]?.[user]?.username,
        user
    )}</b> — ${active.data[chat_id]?.[user]?.active_last || "невідомо"}`;
}

function getInactivePage(chat_id: number, page: number) {
    return getSortedInactive(chat_id).slice(PAGE_LENGTH * (page - 1), PAGE_LENGTH * (page - 1) + PAGE_LENGTH);
}

function getSortedInactive(chat_id: number) {
    return Object.keys(active.data?.[chat_id] || {}).sort((u1, u2) => {
        return (active.data?.[chat_id]?.[u1]?.active_last || 0) > (active.data?.[chat_id]?.[u2]?.active_last || 0)
            ? 1
            : -1;
    });
}

export default chatInactive_cmd;
