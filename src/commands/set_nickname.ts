import type { IGroupTextContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import Escape from "../utils/escape.js";
import { active } from "../redis/active.js";

async function set_nickname(ctx: IGroupTextContext) {
    const nickname = parseCmdArgs(ctx.msg.text as string).join(" ");

    if (nickname.length === 0) {
        await ctx.reply(ctx.t("nick-set-help"));
    } else if (nickname.length > 20) {
        await ctx.reply(ctx.t("nick-max-length-error"));
    } else {
        await Promise.all([
            active.updateUserField(ctx.chat.id, ctx.from.id, "nickname", nickname),
            ctx.reply(ctx.t("nick-set-success", { nickname: Escape.html(nickname) }), {
                disable_notification: true,
                link_preview_options: { is_disabled: true },
            }),
        ]);
    }
}
export default set_nickname;
