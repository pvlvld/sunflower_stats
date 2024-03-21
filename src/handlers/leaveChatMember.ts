import type { Filter } from "grammy";
import type IActive from "../data/active";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";

function leaveChatMemberHandler(
  ctx: Filter<MyContext, "chat_member">,
  active: YAMLWrapper<IActive>
) {
  delete active.data[ctx.chat.id]?.[ctx.chatMember.new_chat_member.user.id];
}

export default leaveChatMemberHandler;
