import { active } from "../redis/active.js";
import type { IContext } from "../types/context.js";
import type { Filter } from "grammy";

function leaveChatMemberHandler(ctx: Filter<IContext, "chat_member">) {
    active.removeUser(ctx.chat.id, ctx.chatMember.new_chat_member.user.id);
}

export default leaveChatMemberHandler;
