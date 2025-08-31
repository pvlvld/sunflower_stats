import type { IGroupTextContext } from "../types/context.js";
import isChatOwner from "../utils/isChatOwner.js";
import getUserId from "../utils/getUserId.js";
import cacheManager from "../cache/cache.js";
import { active } from "../redis/active.js";
import { GrammyError } from "grammy";

async function removeFromChatCleanup(ctx: IGroupTextContext): Promise<void> {
    const chat_id = ctx.chat.id;
    if (!(await isChatOwner(chat_id, ctx.from.id))) return;

    if ((ctx.msg.text || ctx.msg.caption) === "!рест") {
        return void (await ctx.reply(ctx.t("chat-cleanup-protection-usage")).catch((e) => {}));
    }

    const cacheKey = `cleanup_${chat_id}`;
    let targetMembers = cacheManager.TTLCache.get(cacheKey) as { user_id: number }[] | undefined;

    let targetId =
        ctx.msg.reply_to_message?.from?.id ||
        (await getUserId((ctx.msg.text ?? ctx.msg.caption).slice(6), chat_id));
    if (targetId === -1) {
        if (targetMembers) {
            cacheManager.TTLCache.set(`cleanup_${chat_id}`, targetMembers, 60 * 5);
            await setRestStatus(ctx, targetId);
        }
        return void (await ctx.reply(ctx.t("user-not-found")).catch((e) => {}));
    }

    if (!targetMembers) {
        // Try to promote target as an empty admin with with "рест" role
        const [setRestStatusResult, user] = await Promise.all([
            await setRestStatus(ctx, targetId),
            active.getUser(chat_id, targetId),
        ]);
        switch (setRestStatusResult) {
            case "not enough rights set admin":
                return void (await ctx.reply(ctx.t("chat-cleanup-nor-set-admin")));

            case "not enough rights edit admin":
                if (!user) return;
                return void (await ctx.reply(
                    ctx.t("chat-cleanup-user-protected-admin", { name: user.name }),
                ));

            case "success":
                if (!user) return;
                return void (await ctx.reply(
                    ctx.t("chat-cleanup-user-marked-rest", { name: user.name }),
                ));

            default:
                console.error("Unexpected setRestStatus output!");
                return;
        }
    }

    // Try to remove target from target members for the cleanup
    const startLength = targetMembers.length;
    targetMembers = targetMembers.filter((m) => m.user_id === targetId);
    if (targetMembers.length < startLength) {
        const user = await active.getUser(chat_id, targetId);
        if (!user) return void (await ctx.reply(ctx.t("user-not-found")).catch((e) => {}));
        cacheManager.TTLCache.set(cacheKey, targetMembers, 5 * 60);
        return void (await ctx
            .reply(ctx.t("chat-cleanup-user-marked-rest", { name: user.name }))
            .catch((e) => {}));
    }

    cacheManager.TTLCache.set(`cleanup_${chat_id}`, targetMembers, 60 * 5);
    return void (await ctx.reply(ctx.t("user-not-found")).catch((e) => {}));
}

async function setRestStatus(
    ctx: IGroupTextContext,
    targetId: number,
): Promise<"not enough rights set admin" | "not enough rights edit admin" | "success"> {
    try {
        await ctx.promoteChatMember(targetId, { can_manage_chat: true });
    } catch (e) {
        if (e instanceof GrammyError && e.description.includes("not enough rights")) {
            return "not enough rights set admin" as const;
        }
    }

    try {
        await ctx.setChatAdministratorCustomTitle(targetId, "рест");
    } catch (e: any) {
        console.log(e.description);
        return "not enough rights edit admin";
    }

    return "success" as const;
}

export default removeFromChatCleanup;
