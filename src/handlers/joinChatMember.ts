import { getUserFirstStatsDate } from "../utils/getUserFirstStatsDate.js";
import { type IActiveUser, active } from "../data/active.js";
import type { IContext } from "../types/context.js";
import type { Filter } from "grammy";

async function joinChatMember(ctx: Filter<IContext, "chat_member">) {
    const chat_id = ctx.chat.id;
    const user_id = ctx.chatMember.new_chat_member.user.id;
    const active_first = await getUserFirstStatsDate(chat_id, user_id);

    if (active_first) {
        active.data[chat_id] ??= {};
        active.data[chat_id][user_id] ??= {} as IActiveUser;
        active.data[chat_id][user_id].active_first = active_first;
    }
}
export { joinChatMember };
