import { Filter } from "grammy";
import { MyContext } from "../types/context";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

function leaveChatMemberHandler(
  ctx: Filter<MyContext, ":left_chat_member">,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  delete active.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
  delete todayStats.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
}

export default leaveChatMemberHandler;
