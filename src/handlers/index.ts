import { updateChatBotStatus_handler } from "./updateChatBotStatus";
import { adminUpdateHandler } from "./adminUpdateHandler";
import leaveChatMemberHandler from "./leaveChatMember";
import { joinChatMember } from "./joinChatMember";
import cfg from "../config";
import bot from "../bot";

function regHandlers() {
  bot.on("my_chat_member", async (ctx) => {
    updateChatBotStatus_handler(ctx);
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
