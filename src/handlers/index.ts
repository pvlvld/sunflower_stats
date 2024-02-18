import bot from "../bot";
import leaveChatMemberHandler from "./leaveChatMember";
import YAMLStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { botStatsManager } from "../commands/botStats";

function regHandlers(active: YAMLWrapper<IActive>, yamlStats: YAMLStats) {
  bot.on(":left_chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, yamlStats, active);
  });

  bot.on("msg:new_chat_members:me", (ctx) => {
    botStatsManager.newGroup();
  });
}

export default regHandlers;
