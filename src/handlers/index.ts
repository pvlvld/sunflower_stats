import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import type IActive from "../data/active";
import type YAMLWrapper from "../data/YAMLWrapper";
import cfg from "../config";

function regHandlers(active: YAMLWrapper<IActive>) {
  bot.on("my_chat_member", async (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
      botStatsManager.joinGroup();
    } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
      botStatsManager.leftGroup();
      if (ctx.chat.type === "supergroup" && ctx.chat.username) {
        await bot.api.sendMessage(-1002144414380, `#Left @${ctx.chat.username}`).catch((e) => {});
      }
    }
  });

  bot.on("chat_member", (ctx) => {
    if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.new_chat_member.status)) {
      leaveChatMemberHandler(ctx, active);
    }
  });
}

export default regHandlers;
