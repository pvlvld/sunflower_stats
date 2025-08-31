import type { IGroupHearsContext } from "../types/context.js";
import getUserId from "../utils/getUserId.js";
import Escape from "../utils/escape.js";
import cfg from "../config.js";
import { active } from "../redis/active.js";

async function del_user_active(ctx: IGroupHearsContext) {
    const userId = await determineTargetUserId(ctx);
    const user = await active.getUser(ctx.chat.id, userId);

    if (!user) {
        await ctx.reply(ctx.t("user-not-found")).catch((e) => {});
        return;
    }

    const res = await active.removeUser(ctx.chat.id, userId);

    if (!res) {
        await ctx.reply(ctx.t("user-not-found")).catch((e) => {});
        return;
    }

    await ctx
        .reply(ctx.t("active-del-success", { name: Escape.html(user?.name) }), {
            parse_mode: "HTML",
        })
        .catch((e) => {});

    ctx.deleteMessage().catch((e) => {});
}

async function determineTargetUserId(ctx: IGroupHearsContext): Promise<number> {
    const chatMember = await ctx.getChatMember(ctx.from?.id || -1).catch(() => {});
    const isCanDelOthers =
        chatMember?.status === "creator" || cfg.ADMINS.includes(ctx.from?.id || -1);
    const rawTarget = (ctx.msg.text ?? ctx.msg.caption).split(" ").at(-1)!;

    return isCanDelOthers
        ? ctx.msg.reply_to_message?.from?.id ||
              (["вступ", "!ссприховати"].includes(rawTarget)
                  ? undefined
                  : await getUserId(rawTarget, ctx.chat.id)) ||
              ctx.from.id
        : ctx.from.id;
}

export default del_user_active;
