import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import { leftGroup_menu } from "../ui/menus/leftGroup";
import cfg from "../config";
import { adminUpdateHandler } from "./adminUpdateHandler";

function regHandlers() {
  bot.on("my_chat_member", async (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
      botStatsManager.joinGroup();
    } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
      botStatsManager.leftGroup();
      if (ctx.chat.type === "supergroup" && ctx.chat.username) {
        await ctx.api
          .sendMessage("-1002144414380", `#Left @${ctx.chat.username}\nID: ${ctx.chat.id}`, {
            reply_markup: leftGroup_menu,
            reply_parameters: { message_id: -1, allow_sending_without_reply: true },
            disable_notification: true,
          })
          .catch((e) => {
            console.log(e);
          });
      }
    }
  });

  bot.on("chat_member", (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.new_chat_member.status)) {
      leaveChatMemberHandler(ctx);
    }
    adminUpdateHandler(ctx);
  });
}

export default regHandlers;
