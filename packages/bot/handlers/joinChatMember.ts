import { getUserFirstStatsDate } from "../utils/getUserFirstStatsDate.js";
import type { IGroupContext } from "../types/context.js";
import type { Filter } from "grammy";
import { active } from "../redis/active.js";

async function joinChatMember(ctx: Filter<IGroupContext, "chat_member" | ":left_chat_member">) {
    const chat_id = ctx.chat.id;
    const user_id = ctx.chatMember ? ctx.chatMember.new_chat_member.user.id : ctx.msg.left_chat_member.id;
    const active_first = await getUserFirstStatsDate(chat_id, user_id);

    if (active_first) {
        await active.updateUserField(chat_id, user_id, "active_first", active_first);
    }
}
export { joinChatMember };
