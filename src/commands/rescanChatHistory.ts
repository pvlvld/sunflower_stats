import { Menu } from "@grammyjs/menu";
import { historyScanner } from "../scanner/historyScanner.js";
import { IContext, IGroupContext, IGroupHearsCommandContext } from "../types/context.js";
import isChatOwner from "../utils/isChatOwner.js";

export async function rescanChatHistory_command(ctx: IGroupHearsCommandContext) {
    if (!(await isChatOwner(ctx.chat.id, ctx.from.id))) {
        await ctx.reply(ctx.t("error-chat-owner-only")).catch((e) => {});
        return;
    } else {
        await ctx.reply(
            "Ви впевнені, що хочете повторно просканувати історію чату?\n\nВся поточна статистика буде видалена та перерахована заново.",
            {
                reply_markup: rescan_menu,
            }
        );
    }
}

async function rescanChatHistory(ctx: IGroupContext) {
    let chatIdentifier = ctx.chat.username ?? (ctx.chat.id > 0 ? undefined : ctx.chat.id);
    if (!chatIdentifier) {
        console.log(
            `[RescanChatHistory] Chat identifier is not available for chat: ${ctx.chat.id} / ${ctx.chat.username}`
        );
        await ctx.reply("Chat identifier is not available.").catch((e) => {});
        return;
    }

    if (typeof chatIdentifier === "string") {
        const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
        if (result.localeError.message) {
            await ctx.reply(ctx.t(result.localeError.message, result.localeError.variables)).catch((e) => {});
        }
        return;
    }

    const chatFullInfo = await ctx.getChat();

    if (chatFullInfo && chatFullInfo.invite_link) {
        chatIdentifier = chatFullInfo.invite_link;
        const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
        if (result.localeError.message) {
            await ctx.reply(ctx.t(result.localeError.message, result.localeError.variables)).catch((e) => {});
        }
        return;
    }

    chatIdentifier = await ctx
        .createChatInviteLink({
            name: "Соняшник | Сканування історії",
            expire_date: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5, // 5 days
            member_limit: 3,
        })
        .then((link) => link.invite_link)
        .catch((e) => {
            console.log(
                `[RescanChatHistory] Failed to create invite link for chat: ${ctx.chat.id} / ${ctx.chat.username}`
            );
            ctx.reply(ctx.t("history-scan-cant-start")).catch((e) => {});
            return undefined;
        });

    if (!chatIdentifier) {
        console.log(`[RescanChatHistory] Failed to create invite link for chat: ${ctx.chat.id} / ${ctx.chat.username}`);
        await ctx.reply(ctx.t("history-scan-cant-start")).catch((e) => {});
        return;
    }

    const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
    if (result.localeError.message) {
        await ctx.reply(ctx.t(result.localeError.message, result.localeError.variables)).catch((e) => {});
    }
}

export const rescan_menu = new Menu<IContext>("rescan-menu", {
    autoAnswer: true,
})
    .text(
        (ctx) => ctx.t("button-yes"),
        async (ctx) => {
            if (
                ctx.chat?.id &&
                ["supergroup", "group"].includes(ctx.chat?.type!) &&
                (await isChatOwner(ctx.chat.id, ctx.from.id))
            ) {
                await rescanChatHistory(ctx as IGroupContext);
            } else {
                return;
            }
        }
    )
    .text(
        (ctx) => ctx.t("button-no"),
        async (ctx) => {
            if (
                ctx.chat?.id &&
                ["supergroup", "group"].includes(ctx.chat?.type!) &&
                (await isChatOwner(ctx.chat.id, ctx.from.id))
            ) {
                await ctx.deleteMessage().catch((e) => {});
            } else {
                return;
            }
        }
    );
