import type { IGroupContext } from "../../types/context.js";
import { ReactionTypeEmoji } from "@grammyjs/types";
import { Filter } from "grammy";

async function react_cmd(ctx: Filter<IGroupContext, ":text">) {
    ctx.deleteMessage().catch((e) => {});

    await ctx.api
        .setMessageReaction(ctx.chat.id, ctx.msg.reply_to_message!.message_id, [
            { type: "emoji", emoji: ctx.msg.text.split(" ")[1] } as ReactionTypeEmoji,
        ])
        .catch((e) => {
            console.error(e);
        });
}

export { react_cmd };
