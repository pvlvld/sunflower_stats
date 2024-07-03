import type { IMyChatMemberContext } from "../types/context";
import { botStatsManager } from "../commands/botStats";
import { leftGroup_menu } from "../ui/menus/leftGroup";
import { hello } from "../commands/hello";
import help_cmd from "../commands/help";
import cfg from "../config";

async function updateChatBotStatus_handler(ctx: IMyChatMemberContext) {
  // Bot join chat
  if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
    await hello(ctx);
    await help_cmd(ctx);
    botStatsManager.joinGroup();

    if (ctx.chat.type === "supergroup") {
      try {
        const membersCount = await ctx.getChatMemberCount();
        const usernameOtInvite = ctx.chat.username
          ? `@${ctx.chat.username}`
          : (await ctx.getChat().catch((e) => {}))?.invite_link || "-";
        if (membersCount >= 50) {
          await ctx.api.sendMessage(
            cfg.ANALYTICS_CHAT,
            `✅📈 #Join ${ctx.chat.title}\n${usernameOtInvite}\nID: ${ctx.chat.id}\nMembers count: ${membersCount}`,
            {
              reply_parameters: { message_id: -1, allow_sending_without_reply: true },
              disable_notification: true,
              message_thread_id: 3984,
            }
          );
        }
      } catch (e) {}
    }

    // Bot left chat
  } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
    botStatsManager.leftGroup();
    if (ctx.chat.type === "supergroup" && ctx.chat.username) {
      await ctx.api
        .sendMessage(cfg.ANALYTICS_CHAT, `❌📉 #Left @${ctx.chat.username}\nID: ${ctx.chat.id}`, {
          reply_markup: leftGroup_menu,
          reply_parameters: { message_id: -1, allow_sending_without_reply: true },
          disable_notification: true,
          message_thread_id: 3984,
        })
        .catch((e) => {});
    }
  }
}

export { updateChatBotStatus_handler };
