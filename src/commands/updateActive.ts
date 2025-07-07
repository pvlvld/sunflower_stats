import moment from "moment";
import { active, IActiveUser } from "../redis/active.js";
import { IContext, IHearsCommandContext } from "../types/context.js";
import isChatOwner from "../utils/isChatOwner.js";
import { autoRetry } from "@grammyjs/auto-retry";
import cfg from "../config.js";
import cacheManager from "../cache/cache.js";

type IActiveMember = IActiveUser & { user_id: string };

async function updateActive_command(ctx: IHearsCommandContext) {
    const cacheKey = `${ctx.chat.id}:updateActive`;
    if (cacheManager.TextCache.has(cacheKey)) return;
    cacheManager.TextCache.set(cacheKey, "true");

    if (!ctx.from || !(await isChatOwner(ctx.chat.id, ctx.from.id))) {
        await ctx.reply(ctx.t("error-chat-owner-only")).catch((e) => {});
        cacheManager.TextCache.delete(cacheKey);
        return;
    }

    ctx.api.config.use(autoRetry());

    const [activeMembers, memberCount] = await Promise.all([active.getChatUsers(ctx.chat.id), ctx.getChatMemberCount()]);

    // Convert to array and inject user_id into each member object
    const members = Object.entries(activeMembers)
        .map(([user_id, info]) => {
            (<IActiveMember>info).user_id = user_id;
            return <IActiveMember>info;
        })
        .sort((a, b) => (moment(a.active_last).isBefore(moment(b.active_last)) ? 1 : -1));

    let membersVerified = 0;
    let apiChatMember = {} as Awaited<ReturnType<IContext["api"]["getChatMember"]>>;
    for (const user of members) {
        if (membersVerified >= memberCount) {
            await active.removeUser(ctx.chat.id, parseInt(user.user_id));
            continue;
        }

        apiChatMember = await ctx.api.getChatMember(ctx.chat.id, parseInt(user.user_id)).catch((e) => {
            return { status: "left" } as Awaited<ReturnType<IContext["api"]["getChatMember"]>>;
        });
        if (cfg.STATUSES.LEFT_STATUSES.includes(apiChatMember.status)) {
            await active.removeUser(ctx.chat.id, parseInt(user.user_id));
        } else {
            membersVerified++;
        }
    }

    await ctx
        .reply(
            `Successfully updated active members list.\n\nTotal members: ${memberCount}\nRemoved members: ${
                memberCount - membersVerified
            }\n`
        )
        .catch((e) => {});
    cacheManager.TextCache.delete(cacheKey);
}

export { updateActive_command };
