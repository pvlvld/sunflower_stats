import { historyScanProposal_menu } from "../ui/menus/historyScanProposal.js";
import type { IGroupMyChatMemberContext } from "../types/context.js";
import { historyScanner } from "../scanner/historyScanner.js";
import { botStatsManager } from "../commands/botStats.js";
import { leftGroup_menu } from "../ui/menus/leftGroup.js";
import { sleepAsync } from "../utils/sleep.js";
import { hello } from "../commands/hello.js";
import formattedDate from "../utils/date.js";
import cacheManager from "../cache/cache.js";
import { active } from "../data/active.js";
import help_cmd from "../commands/help.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";

async function updateChatBotStatus_handler(ctx: IGroupMyChatMemberContext) {
  // Bot join chat
  if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
    const firstRecordedMessageDate = await DBStats.chat.firstRecordDate(ctx.chat.id);

    // History scan only if bot was not in chat earlier.
    if (
      !firstRecordedMessageDate ||
      formattedDate.dateToYYYYMMDD(firstRecordedMessageDate) === formattedDate.today[0]
    ) {
      if (ctx.chat.username) {
        historyScanner.scanChat(ctx.chat.username, ctx.chat.id);
      } else {
        await ctx.reply(
          "Відсканувати історію чату, щоб старі повідомлення відображались в статистиці чату?",
          {
            reply_markup: historyScanProposal_menu,
            //@ts-expect-error
            reply_parameters: { message_id: ctx.msg?.id ?? -1, allow_sending_without_reply: true },
          }
        );
      }
    }

    await hello(ctx);
    await help_cmd(ctx);
    botStatsManager.joinGroup();

    if (ctx.chat.type === "supergroup" || ctx.chat.type === "group") {
      try {
        await sleepAsync(500);
        const membersCount = (await ctx.getChatMemberCount().catch((e) => {})) || 0;
        const invite = (await ctx.getChat().catch((e) => {}))?.invite_link || "-";

        await ctx.api.sendMessage(
          cfg.ANALYTICS_CHAT,
          `✅📈 #Join ${ctx.chat.title}\nMembers count: <b>${membersCount}</b>\nID: ${ctx.chat.id}\nusername: @${ctx.chat.username}\ninvite:${invite}`,
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
    let admins_text = "";

    admins.forEach((a) => {
      admins_text +=
        admins_text +
        `<a href="tg://user?id=${a.user_id}">${
          active.data[ctx.chat.id]?.[a.user_id]?.name || a.status
        }</a>: ${a.status}\n`;
    });

    if (admins_text.length) {
      admins_text = "Admins:\n" + admins_text;
    }

    await ctx.api
      .sendMessage(
        cfg.ANALYTICS_CHAT,
        `❌📉 #Left ${ctx.chat.title}\nID: ${ctx.chat.id}\nusername: @${ctx.chat.username}\n${admins_text}`,
        {
          reply_markup: leftGroup_menu,
          reply_parameters: { message_id: -1, allow_sending_without_reply: true },
          link_preview_options: { is_disabled: true },
          disable_notification: true,
          message_thread_id: 3984,
        }
      )
      .catch((e) => {});
  }
}

export { updateChatBotStatus_handler };
