import type { IGroupMyChatMemberContext } from "../types/context";
import { botStatsManager } from "../commands/botStats";
import { leftGroup_menu } from "../ui/menus/leftGroup";
import { hello } from "../commands/hello";
import cacheManager from "../cache/cache";
import { active } from "../data/active";
import help_cmd from "../commands/help";
import cfg from "../config";
import { sleepAsync } from "../utils/sleep";

async function updateChatBotStatus_handler(ctx: IGroupMyChatMemberContext) {
  // Bot join chat
  if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
    await hello(ctx);
    await help_cmd(ctx);
    botStatsManager.joinGroup();

    if (ctx.chat.type === "supergroup") {
      try {
        await sleepAsync(1000);
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
