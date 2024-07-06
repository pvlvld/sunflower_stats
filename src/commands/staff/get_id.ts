import type {
  IGroupAnimationCaptionContext,
  IGroupHearsContext,
  IGroupPhotoCaptionContext,
} from "../../types/context.js";

async function getId_cmd(
  ctx: IGroupHearsContext | IGroupPhotoCaptionContext | IGroupAnimationCaptionContext
) {
  const chat_id = ctx.chat.id;
  const sender_id = ctx.from?.id;
  const reply_to_id = ctx.msg.reply_to_message?.from?.id;
  const photo_id = ctx.msg.reply_to_message?.photo
    ? ctx.msg.reply_to_message.photo[ctx.msg.reply_to_message.photo.length - 1]
    : undefined;
  const animation_id = ctx.msg.reply_to_message?.animation
    ? ctx.msg.reply_to_message.animation.file_id
    : undefined;

  void (await ctx
    .reply(
      `
chat id: ${chat_id}
user id: ${sender_id}
${reply_to_id ? `reply to user id: ${reply_to_id}` : ""}
${photo_id ? `photo id: ${photo_id}` : ""}
${animation_id ? `gif id: ${animation_id}` : ""}`
    )
    .catch((e) => {}));
}

export { getId_cmd };
