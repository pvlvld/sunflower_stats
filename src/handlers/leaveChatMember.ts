import type { IContext } from "../types/context.js";
import { active } from "../data/active.js";
import type { Filter } from "grammy";

function leaveChatMemberHandler(ctx: Filter<IContext, "chat_member">) {
  delete active.data[ctx.chat.id]?.[ctx.chatMember.new_chat_member.user.id];
}

export default leaveChatMemberHandler;
