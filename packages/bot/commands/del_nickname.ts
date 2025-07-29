import type { IGroupHearsCommandContext } from "../types/context.js";
import { active } from "../redis/active.js";

async function del_nickname(ctx: IGroupHearsCommandContext) {
    await active.updateUserField(ctx.chat.id, ctx.from.id, "nickname", null);
    await ctx
        .reply(ctx.t("nick-del-success"), {
            disable_notification: true,
            link_preview_options: { is_disabled: true },
        })
        .catch((e) => {});
}

export default del_nickname;
