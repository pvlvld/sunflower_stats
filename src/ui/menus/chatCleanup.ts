import getUserNameLink from "../../utils/getUserNameLink.js";
import { active, IActiveUser } from "../../data/active.js";
import type { IContext } from "../../types/context.js";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import isChatOwner from "../../utils/isChatOwner.js";
import { autoRetry } from "@grammyjs/auto-retry";
import cacheManager from "../../cache/cache.js";
import { GrammyError } from "grammy";

const chatCleanup_menu = new Menu<IContext>("chatCleanup-menu", {
    autoAnswer: false,
    onMenuOutdated: async (ctx) => {
        // : IGroupTextContext & MenuFlavor
        await ctx.deleteMessage().catch((e) => {});
        await ctx.answerCallbackQuery("Ця чистка застаріла. Створіть нову.").catch((e) => {});
    },
})
    .dynamic(async (ctx, range) => {
        const chat_id = ctx.chat?.id;
        const from_id = ctx.from?.id;
        if (!chat_id || !from_id) {
            return;
        }

        const targetMembers = cacheManager.TTLCache.get(`cleanup_${ctx.chat.id}`) as
            | { user_id: number }[]
            | undefined;

        range.text("Видалити ✅", async (ctx) => {
            ctx.answerCallbackQuery().catch((e) => {});

            if (!(await isChatOwner(chat_id, from_id))) {
                return;
            }

            if (await destroyMenuIfOutdated(ctx, targetMembers)) {
                return void (await ctx
                    .reply("Ця чистка застаріла. Створіть нову.")
                    .catch((e) => {}));
            }

            ctx.deleteMessage().catch((e) => {});

            const statusMessage = await ctx.reply("Починаю чистку!").catch((e) => {});
            const cleanupStatus = await chatCleanupWorker(
                ctx,
                chat_id,
                targetMembers as { user_id: number }[]
            );

            if (statusMessage && cleanupStatus) {
                return void (await ctx.api
                    .editMessageText(chat_id, statusMessage.message_id, "Чистку успішно закінчено!")
                    .catch((e) => {}));
            }

            if (statusMessage) {
                return void (await ctx.api
                    .editMessageText(
                        chat_id,
                        statusMessage.message_id,
                        "⚠️ У бота недостатньо прав. Будь ласка, видайте боту наступні права: \nБлокувати користувачів (Ban users)"
                    )
                    .catch((e) => {}));
            }
        });

        range.text("Скасувати ❌", async (ctx) => {
            ctx.answerCallbackQuery().catch((e) => {});

            if (
                !(await isChatOwner(chat_id, from_id)) ||
                (await destroyMenuIfOutdated(ctx, targetMembers))
            ) {
                return;
            }

            cacheManager.TTLCache.del(`cleanup_${chat_id}`);
            await ctx.menu.close({ immediate: true }).catch((e) => {});
            await ctx.deleteMessage().catch((e) => {});
        });

        range.row().text("Список 🔍", async (ctx) => {
            ctx.answerCallbackQuery().catch((e) => {});

            if (!(await isChatOwner(chat_id, from_id))) {
                return;
            }

            if (await destroyMenuIfOutdated(ctx, targetMembers)) {
                return void (await ctx
                    .reply("Ця чистка застаріла. Створіть нову.")
                    .catch((e) => {}));
            }
            let messageText = ctx.msg?.text;
            if (!messageText) {
                return;
            }

            const targetMembersListIndex = messageText.indexOf("Список:");

            if (targetMembersListIndex && targetMembersListIndex === -1) {
                messageText = `${messageText.replace(
                    /\d+/,
                    String(targetMembers!.length)
                )}\n\nСписок:\n${getTargetMembersList(chat_id, targetMembers as { user_id: number }[])}`;

                await ctx.editMessageText(messageText, {
                    link_preview_options: { is_disabled: true },
                });
            } else {
                ctx.editMessageText(messageText.slice(0, targetMembersListIndex));
            }
        });

        return range;
    })
    .row()
    .url("Підтримати існування соняха 🧡", "https://send.monobank.ua/jar/6TjRWExdMt");

async function destroyMenuIfOutdated(
    ctx: IContext & MenuFlavor,
    targetMembers: { user_id: number }[] | undefined
): Promise<boolean> {
    if (ctx.msg?.text && !targetMembers) {
        try {
            ctx.menu.close({ immediate: true }).catch((e) => {});
            await ctx.deleteMessage().catch((e) => {});
            return true;
        } catch (error) {
            console.log(error);
            return true;
        }
    }
    return false;
}

const targetMembersListMaxSize = 100;

function getTargetMembersList(chat_id: number, targetMembers: { user_id: number }[]): string {
    const targetMemberNames: string[] = [];
    let user: IActiveUser | undefined;
    for (let i = 0; i < Math.min(targetMembersListMaxSize, targetMembers.length); i++) {
        user = active.data[chat_id]?.[targetMembers[i].user_id];
        if (user) {
            targetMemberNames.push(
                getUserNameLink.html(user.name, undefined, targetMembers[i].user_id)
            );
        }
    }

    if (targetMembers.length > targetMembersListMaxSize) {
        targetMemberNames.push("...");
    }

    return targetMemberNames.join("\n");
}

async function chatCleanupWorker(
    ctx: IContext & MenuFlavor,
    chat_id: number,
    targetMembers: { user_id: number }[]
) {
    ctx.api.config.use(autoRetry());
    ctx.replyWithChatAction("typing").catch((e) => {});

    for (let i = 0; i < targetMembers.length; i++) {
        try {
            await ctx.banChatMember(targetMembers[i].user_id);
            delete active.data[chat_id]?.[targetMembers[i].user_id];
        } catch (e) {
            if (e instanceof GrammyError) {
                if (e.description.indexOf("not enough rights") !== -1) {
                    cacheManager.TTLCache.del(`cleanup_${chat_id}`);
                    return false;
                }
            } else {
                delete active.data[chat_id]?.[targetMembers[i].user_id];
            }
        }
    }
    cacheManager.TTLCache.del(`cleanup_${chat_id}`);
    return true;
}

export default chatCleanup_menu;
