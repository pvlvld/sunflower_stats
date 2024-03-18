import type { Filter } from "grammy";
import type IActive from "../data/active";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";

const left_statuses = ["kicked", "left"];

function leaveChatMemberHandler(
  ctx: Filter<MyContext, "chat_member">,
  active: YAMLWrapper<IActive>
) {
  if (left_statuses.includes(ctx.chatMember.new_chat_member.status)) {
    delete active.data[ctx.chat.id]?.[ctx.chatMember.new_chat_member.user.id];
  }
}

export default leaveChatMemberHandler;
