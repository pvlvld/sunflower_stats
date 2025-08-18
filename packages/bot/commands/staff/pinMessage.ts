import { IGroupHearsCommandContext } from "../../types/context.js";

async function pinMessage(ctx: IGroupHearsCommandContext) {
    if (ctx.msg.reply_to_message) {
        await ctx.api
            .pinChatMessage(ctx.chat.id, ctx.msg.reply_to_message.message_id)
            .catch((e) => console.error("Failed to pin message:", e));
    }
}

export { pinMessage };
