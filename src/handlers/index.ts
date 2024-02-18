import bot from "../bot";
import leaveChatMemberHandler from "./leaveChatMember";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { botStatsManager } from "../commands/botStats";

function regHandlers(active: YAMLWrapper<IActive>, todayStats: TodayStats) {
  bot.on(":left_chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, todayStats, active);
  });

  bot.on("msg:new_chat_members:me", (ctx) => {
    botStatsManager.newGroup();
  });
}

export default regHandlers;
