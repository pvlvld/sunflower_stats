import type { IGroupHearsCommandContext } from "../types/context.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { active } from "../redis/active.js";

const PAGE_LENGTH = 25;

async function chatInactive_cmd(ctx: IGroupHearsCommandContext) {
    const page = parseInt(parseCmdArgs(ctx.msg.text ?? ctx.msg.caption)[0] ?? "");
    if (!page) {
        await ctx.reply(ctx.t("inactive-enter-page"));
        return;
    }

    await ctx.reply((await getInactivePageMessage(ctx.chat.id, Math.abs(page))).message, {
        link_preview_options: { is_disabled: true },
        disable_notification: true,
    });
}

const EmptyPageError = {
    status: false,
    message: "empty-page-error",
};

async function getInactivePageMessage(chat_id: number, page: number) {
    const users = await active.getChatUsers(chat_id);
    const inactiveUsers = getInactivePage(users, page);
    if (inactiveUsers.length === 0) return EmptyPageError;

    return {
        status: true,
        message: inactiveUsers
            .map((target, i) => `${i + 1 + (page - 1) * PAGE_LENGTH}. ${genUserPageRecord(users, target)}`)
            .join("\n"),
    };
}

function genUserPageRecord(users: Awaited<ReturnType<typeof active.getChatUsers>>, target: string) {
    return `<b>${getUserNameLink.html(
        users[target]?.nickname || users[target]?.name || "🌻",
        users[target]?.username,
        target
    )}</b> — ${users[target]?.active_last || "🌻"}`;
}

function getInactivePage(users: Awaited<ReturnType<typeof active.getChatUsers>>, page: number) {
    return getSortedInactive(users).slice(PAGE_LENGTH * (page - 1), PAGE_LENGTH * (page - 1) + PAGE_LENGTH);
}

function getSortedInactive(users: Awaited<ReturnType<typeof active.getChatUsers>>) {
    return Object.keys(users).sort((u1, u2) => {
        return (users[u1]?.active_last || 0) > (users[u2]?.active_last || 0) ? 1 : -1;
    });
}

export default chatInactive_cmd;
