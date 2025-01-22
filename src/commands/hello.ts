import type { IContext } from "../types/context.js";

async function hello(ctx: IContext) {
    return await ctx
        .reply(ctx.t("hello"), {
            disable_notification: true,
            link_preview_options: { is_disabled: true },
            reply_parameters: {
                allow_sending_without_reply: true,
                message_id: ctx.msg?.message_id ?? -1,
            },
        })
        .catch((e) => {});
}

export { hello };
