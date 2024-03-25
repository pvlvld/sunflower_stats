import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import type IActive from "../data/active";
import type YAMLWrapper from "../data/YAMLWrapper";

const left_statuses = ["kicked", "left"];

function regHandlers(active: YAMLWrapper<IActive>) {
  bot.on("my_chat_member", async (ctx) => {
    if (left_statuses.includes(ctx.myChatMember.old_chat_member.status)) {
      botStatsManager.joinGroup();
    } else if (left_statuses.includes(ctx.myChatMember.new_chat_member.status)) {
      botStatsManager.leftGroup();
      if (ctx.chat.type === "supergroup" && ctx.chat.username) {
        await ctx.api.sendMessage(-1004189530299, `#Left @${ctx.chat.username}`).catch((e) => {});
      }
    }
  });

  bot.on("chat_member", (ctx) => {
    if (left_statuses.includes(ctx.chatMember.new_chat_member.status)) {
      leaveChatMemberHandler(ctx, active);
    }
  });
}

export default regHandlers;
