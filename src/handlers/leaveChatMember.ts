import { Filter } from "grammy";
import { MyContext } from "../types/context";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

const left_statuses = ["kicked", "left"];

function leaveChatMemberHandler(
  ctx: Filter<MyContext, "chat_member">,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  if (left_statuses.includes(ctx.chatMember.new_chat_member.status)) {
    delete active.data[ctx.chat.id]?.[ctx.chatMember.new_chat_member.user.id];
    delete todayStats.data[ctx.chat.id]?.[
      ctx.chatMember.new_chat_member.user.id
    ];
  }
}

export default leaveChatMemberHandler;
