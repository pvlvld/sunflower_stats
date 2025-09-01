import { Menu } from "@grammyjs/menu";
import { historyScanner } from "../scanner/historyScanner.js";
import { IContext, IGroupContext, IGroupHearsCommandContext } from "../types/context.js";
import isChatOwner from "../utils/isChatOwner.js";
import { Database } from "../db/db.js";
import moment from "moment";

export async function rescanChatHistory_command(ctx: IGroupHearsCommandContext) {
    if (!(await isChatOwner(ctx.chat.id, ctx.from.id))) {
        await ctx.reply(ctx.t("error-chat-owner-only")).catch((e) => {});
        return;
    } else {
        await ctx.reply(
            "Ви впевнені, що хочете повторно просканувати історію чату?\n\nВся поточна статистика буде видалена та перерахована заново.",
            {
                reply_markup: rescan_menu,
            },
        );
    }
}

async function rescanChatHistory(ctx: IGroupContext) {
    const isRescanned = await isRescannedPastWeek(ctx.chat.id);
    if (isRescanned.status) {
        await ctx.reply(
            ctx.t(
                `Сканування вже проводилось: ${moment(isRescanned.date).format(
                    "DD.MM.YYYY",
                )}\nБудь ласка, зачекайте до наступного тижня.`,
            ),
        );
        return;
    }
    let chatIdentifier = ctx.chat.username ?? (ctx.chat.id > 0 ? undefined : ctx.chat.id);
    if (!chatIdentifier) {
        console.log(
            `[RescanChatHistory] Chat identifier is not available for chat: ${ctx.chat.id} / ${ctx.chat.username}`,
        );
        await ctx.reply("Chat identifier is not available.").catch((e) => {});
        return;
    }

    if (typeof chatIdentifier === "string") {
        const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
        if (result.localeError.message) {
            await ctx
                .reply(ctx.t(result.localeError.message, result.localeError.variables))
                .catch((e) => {});
        }
        return;
    }

    const chatFullInfo = await ctx.getChat();

    if (chatFullInfo && chatFullInfo.invite_link) {
        chatIdentifier = chatFullInfo.invite_link;
        console.log(
            `[RescanChatHistory] Using existing invite link for chat: ${ctx.chat.id} / ${ctx.chat.username} - ${chatIdentifier}`,
        );
        const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
        if (result.localeError.message) {
            await ctx
                .reply(ctx.t(result.localeError.message, result.localeError.variables))
                .catch((e) => {});
        }
        return;
    }

    chatIdentifier = await ctx
        .createChatInviteLink({
            name: "Соняшник | Сканування історії",
            expire_date: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5, // 5 days
            member_limit: 3,
            creates_join_request: false,
        })
        .then((link) => link.invite_link)
        .catch((e) => {
            return undefined;
        });

    if (!chatIdentifier) {
        console.log(
            `[RescanChatHistory] Failed to create invite link for chat: ${ctx.chat.id} / ${ctx.chat.username}`,
        );
        await ctx.reply(ctx.t("history-scan-cant-start")).catch((e) => {});
        return;
    }

    const result = await historyScanner.scanChat(chatIdentifier, ctx.chat.id, true);
    if (result.localeError.message) {
        await ctx
            .reply(ctx.t(result.localeError.message, result.localeError.variables))
            .catch((e) => {});
    }
}

export const rescan_menu = new Menu<IGroupContext>("rescan-menu", {
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
                ctx.deleteMessage().catch((e) => {});
                await ctx
                    .reply("Чат додано в чергу на сканування. Будь ласка, зачекайте.")
                    .catch((e) => {});
                await rescanChatHistory(ctx);
            }
            return;
        },
    )
    .text(
        (ctx) => ctx.t("button-no"),
        async (ctx) => {
            if (
                ctx.chat?.id &&
                ["supergroup", "group"].includes(ctx.chat?.type!) &&
                (await isChatOwner(ctx.chat.id, ctx.from.id))
            ) {
                ctx.deleteMessage().catch((e) => {});
            }
            return;
        },
    );

async function isRescannedPastWeek(chat_id: number) {
    const chat = await Database.poolManager.getPool.query(
        `SELECT rescanned_at FROM chats WHERE chat_id = $1`,
        [chat_id],
    );
    const date = chat?.rows[0]?.rescanned_at;
    const oneWeekAgo = moment().subtract(7, "days").startOf("day");
    const status = date && moment(date).isAfter(oneWeekAgo);
    return { status, date };
}
