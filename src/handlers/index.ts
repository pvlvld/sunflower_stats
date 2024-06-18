import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import { leftGroup_menu } from "../ui/menus/leftGroup";
import cfg from "../config";
import { adminUpdateHandler } from "./adminUpdateHandler";
import help_cmd from "../commands/help";
import { joinChatMember } from "./joinChatMember";

function regHandlers() {
  bot.on("my_chat_member", async (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
      await help_cmd(ctx);
      botStatsManager.joinGroup();

      if (ctx.chat.type === "supergroup" && ctx.chat.username) {
        try {
          const membersCount = await ctx.getChatMemberCount();
          if (membersCount >= 50) {
            await ctx.api.sendMessage(
              cfg.ANALYTICS_CHAT,
              `📈 #Join @${ctx.chat.username}\nID: ${ctx.chat.id}\nMembers count: ${membersCount}`,
              {
                reply_parameters: { message_id: -1, allow_sending_without_reply: true },
                disable_notification: true,
                message_thread_id: 3984,
              }
            );
          }
        } catch (e) {}
      }
    } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
      botStatsManager.leftGroup();
      if (ctx.chat.type === "supergroup" && ctx.chat.username) {
        await ctx.api
          .sendMessage(cfg.ANALYTICS_CHAT, `📉 #Left @${ctx.chat.username}\nID: ${ctx.chat.id}`, {
            reply_markup: leftGroup_menu,
            reply_parameters: { message_id: -1, allow_sending_without_reply: true },
            disable_notification: true,
            message_thread_id: 3984,
          })
          .catch((e) => {});
      }
    }
  });

  bot.on("chat_member", (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.new_chat_member.status)) {
      leaveChatMemberHandler(ctx);
    } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.old_chat_member.status)) {
      joinChatMember(ctx);
    }
    adminUpdateHandler(ctx);
  });
}

export default regHandlers;
