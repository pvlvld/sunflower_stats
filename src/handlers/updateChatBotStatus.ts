import { historyScanProposal_menu } from "../ui/menus/historyScanProposal.js";
import type { IGroupMyChatMemberContext } from "../types/context.js";
import { historyScanner } from "../scanner/historyScanner.js";
import { botStatsManager } from "../commands/botStats.js";
// import { leftGroup_menu } from "../ui/menus/leftGroup.js";
import { sleepAsync } from "../utils/sleep.js";
import formattedDate from "../utils/date.js";
import cacheManager from "../cache/cache.js";
import { active } from "../redis/active.js";
import help_cmd from "../commands/help.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { Database } from "../db/db.js";
import Escape from "../utils/escape.js";
import { LocaleService } from "../cache/localeService.js";
import { start_cmd } from "../commands/start.js";
import { changeLocaleCommand } from "../commands/changeLocale.js";

async function updateChatBotStatus_handler(ctx: IGroupMyChatMemberContext) {
    // Bot join chat
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
        botStatsManager.joinGroup();

        let chatLocale = ctx.from.language_code;

        if (chatLocale && LocaleService.isValid(chatLocale)) {
            LocaleService.set(ctx.chat.id, chatLocale);
            await ctx.i18n.renegotiateLocale();
            Database.chat.settings.set(ctx.chat.id, {
                locale: chatLocale,
            });
        }

        const locale_msg = await changeLocaleCommand(ctx, true);
        // if (hello_msg) {
        //     hello_msg.message_id;
        // }
        // History scan only if there is more than 500 messages.
        if (locale_msg && locale_msg.message_id > 500) {
            if (ctx.chat.username) {
                historyScanner.scanChat(ctx.chat.username, ctx.chat.id);
            } else {
                await ctx.reply(ctx.t("history-scan-prompt"), {
                    reply_markup: historyScanProposal_menu,
                    reply_parameters: {
                        //@ts-expect-error
                        message_id: ctx.msg?.id ?? -1,
                        allow_sending_without_reply: true,
                    },
                });
            }
        }

        if (ctx.chat.type === "supergroup" || ctx.chat.type === "group") {
            try {
                await sleepAsync(500);
                const membersCount = (await ctx.getChatMemberCount().catch((e) => {})) || 0;
                const invite = (await ctx.getChat().catch((e) => {}))?.invite_link || "-";

                await ctx.api.sendMessage(
                    cfg.ANALYTICS_CHAT,
                    `✅📈 #Join ${Escape.html(ctx.chat.title)}\nMembers count: <b>${membersCount}</b>\nID: ${
                        ctx.chat.id
                    }\nusername: @${ctx.chat.username}\ninvite:${invite}\nInvited by: ${getUserNameLink.html(
                        ctx.from.first_name,
                        ctx.from.username,
                        ctx.from.id
                    )} (id: ${ctx.from.id})`,
                    {
                        reply_parameters: { message_id: -1, allow_sending_without_reply: true },
                        link_preview_options: { is_disabled: true },
                        disable_notification: true,
                        message_thread_id: 3984,
                    }
                );
            } catch (e) {}
        }

        // Bot left chat
    } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
        botStatsManager.leftGroup();

        const admins = cacheManager.ChatAdminsCache.getAdmins(ctx.chat.id);
        const users = await active.getChatUsers(ctx.chat.id);
        let admins_text = "";

        admins.forEach((a) => {
            admins_text += `<a href="tg://user?id=${a.user_id}">${users?.[a.user_id]?.name || a.status}</a>: ${
                a.status
            }\n`;
        });

        if (admins_text.length) {
            admins_text = "Admins:\n" + admins_text;
        }

        await ctx.api
            .sendMessage(
                cfg.ANALYTICS_CHAT,
                `❌📉 #Left ${Escape.html(ctx.chat.title)}\nID: ${ctx.chat.id}\nusername: @${
                    ctx.chat.username
                }\nKicked by: ${getUserNameLink.html(ctx.from.first_name, ctx.from.username, ctx.from.id)} (id: ${
                    ctx.from.id
                })\n${admins_text}`,
                {
                    // reply_markup: leftGroup_menu,
                    reply_parameters: { message_id: -1, allow_sending_without_reply: true },
                    link_preview_options: { is_disabled: true },
                    disable_notification: true,
                    message_thread_id: 3984,
                }
            )
            .catch((e) => {});
    }

    //TODO:
    // - separate into a handler
    // - separate bot join and leave
    // - update join/leave status
    Database.poolManager.getPool
        .query(
            `INSERT INTO public.chats (chat_id, title)
                VALUES (${ctx.chat.id}, '$1')
                ON CONFLICT (chat_id)
                DO UPDATE SET title = EXCLUDED.title;`,
            [ctx.chat.title]
        )
        .catch((e) => {});
}

export { updateChatBotStatus_handler };
