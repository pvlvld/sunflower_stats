import bot from "../bot";
import { botStatsManager } from "../commands/botStats";
import leaveChatMemberHandler from "./leaveChatMember";
import type IActive from "../data/active";
import type TodayStats from "../data/stats";
import type YAMLWrapper from "../data/YAMLWrapper";

function regHandlers(active: YAMLWrapper<IActive>, todayStats: TodayStats) {
  bot.on("msg:new_chat_members:me", () => {
    botStatsManager.newGroup();
  });

  bot.on("chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, todayStats, active);
  });
}

export default regHandlers;
