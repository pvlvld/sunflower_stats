import bot from "../bot";
import leaveChatMemberHandler from "./leaveChatMember";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { botStatsManager } from "../commands/botStats";

function regHandlers(active: YAMLWrapper<IActive>, todayStats: TodayStats) {
  bot.on("msg:new_chat_members:me", () => {
    botStatsManager.newGroup();
  });

  bot.on("chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, todayStats, active);
  });
}

export default regHandlers;
