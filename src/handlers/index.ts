import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import type IActive from "../data/active";
import type YAMLWrapper from "../data/YAMLWrapper";

function regHandlers(active: YAMLWrapper<IActive>) {
  bot.on("msg:new_chat_members:me", () => {
    botStatsManager.newGroup();
  });

  bot.on("chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, active);
  });
}

export default regHandlers;
