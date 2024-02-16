import bot from "../bot";
import leaveChatMemberHandler from "./leaveChatMember";
import YAMLStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

function regHandlers(active: YAMLWrapper<IActive>, yamlStats: YAMLStats) {
  bot.on(":left_chat_member", (ctx) => {
    leaveChatMemberHandler(ctx, yamlStats, active);
  });
}

export default regHandlers;
