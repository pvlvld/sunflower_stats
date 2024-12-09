import type { IGroupHearsContext } from "../../types/context.js";
import cfg from "../../config.js";

async function react_cmd(ctx: IGroupHearsContext) {
    if (!cfg.ADMINS.includes(ctx.from.id)) return;

    ctx.deleteMessage().catch((e) => {});

    if (!ctx.msg.reply_to_message) return;
    const reaction = ctx.msg.text?.split(" ")[1];

    if (reaction === undefined) return;

    await ctx.api
        .setMessageReaction(ctx.chat.id, ctx.msg.reply_to_message.message_id, [
            { type: "emoji", emoji: reaction as any },
        ])
        .catch((e) => {
            console.error(e);
        });
}

export { react_cmd };
