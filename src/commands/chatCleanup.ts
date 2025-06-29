import type { IGroupTextContext } from "../types/context.js";
import chatCleanup_menu from "../ui/menus/chatCleanup.js";
import isValidNumbers from "../utils/isValidNumbers.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import isChatOwner from "../utils/isChatOwner.js";
import cacheManager from "../cache/cache.js";
import { active } from "../redis/active.js";
import { Database } from "../db/db.js";
import moment from "moment";

export async function chatCleanup(ctx: IGroupTextContext): Promise<void> {
    const args = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);

    if (args.length !== 2 || !isValidNumbers([args[0], args[1]])) {
        return void (await ctx.reply(ctx.t("chat-cleanup-usage")));
    }

    const chat_id = ctx.chat.id;
    const user_id = ctx.from.id;

    if (!(await isChatOwner(chat_id, user_id))) {
        return;
    }

    if (cacheManager.TTLCache.get(`cleanup_${chat_id}`) !== undefined) {
        return void (await ctx.reply(ctx.t("chat-cleanup-already-running")));
    }

    const [targetDaysCount, targetMessagesCount] = args as string[];

    let [targetMembers, users] = await Promise.all([
        Database.stats.chat.usersBelowTargetMessagesLastXDays(chat_id, targetDaysCount, targetMessagesCount),
        active.getChatUsers(chat_id),
    ]);

    // Filter left chat members & members that in chat less than targetDaysCount
    const beforeTargetDaysCount = moment().subtract(targetDaysCount + 1, "days");
    targetMembers = targetMembers.filter((m) => {
        return users?.[m.user_id]?.active_last && beforeTargetDaysCount.isSameOrBefore(users?.[m.user_id]?.active_last);
    });

    if (targetMembers.length === 0) {
        return void (await ctx.reply(ctx.t("chat-cleanup-nothing-found")));
    }

    cacheManager.TTLCache.set(`cleanup_${chat_id}`, targetMembers, 60 * 5);
    void (await ctx.reply(getChatCleanupText(ctx, String(targetMembers.length), targetDaysCount, targetMessagesCount), {
        reply_markup: chatCleanup_menu,
    }));
}

export function getChatCleanupText(
    ctx: IGroupTextContext,
    targetMembersCount: string,
    targetDaysCount: string,
    targetMessagesCount: string
) {
    return ctx.t("chat-cleanup-text", {
        targetMembersCount,
        targetDaysCount,
        targetMessagesCount,
    });
}
