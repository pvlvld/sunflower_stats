import cfg from "../config.js";
import { IContext } from "../types/context.js";
import start_menu from "../ui/menus/start.js";

function start_cmd(ctx: IContext) {
    ctx.replyWithPhoto(cfg.MEDIA.IMG.stats_example, {
        caption: ctx.t("start"),
        disable_notification: true,
        reply_markup: start_menu,
        reply_parameters: {
            allow_sending_without_reply: true,
            message_id: ctx.msg?.message_id ?? -1,
        },
    }).catch(console.error);
}

export { start_cmd };
