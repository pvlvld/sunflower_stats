import type { IContext } from "../types/context.js";
import help_menu from "../ui/menus/help.js";

async function help_cmd(ctx: IContext) {
    return await ctx
        .reply(ctx.t("help"), {
            disable_notification: true,
            reply_markup: help_menu,
            link_preview_options: { is_disabled: true },
            reply_parameters: {
                allow_sending_without_reply: true,
                message_id: ctx.msg?.message_id ?? -1,
            },
        })
        .catch(console.error);
}

export default help_cmd;
