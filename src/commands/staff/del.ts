import { IGroupHearsContext } from "../../types/context";

async function delMessage(ctx: IGroupHearsContext) {
  if (ctx.msg.reply_to_message?.message_id) {
    void (await ctx.api
      .deleteMessage(ctx.chat.id, ctx.msg.reply_to_message?.message_id)
      .catch((e) => {}));

    void (await ctx.deleteMessage().catch((e) => {}));
  }
}

export { delMessage };
