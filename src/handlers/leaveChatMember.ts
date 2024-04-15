import type { Filter } from "grammy";
import type { MyContext } from "../types/context";
import { active } from "../data/active";

function leaveChatMemberHandler(ctx: Filter<MyContext, "chat_member">) {
  delete active.data[ctx.chat.id]?.[ctx.chatMember.new_chat_member.user.id];
}

export default leaveChatMemberHandler;
