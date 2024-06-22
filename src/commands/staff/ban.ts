import { IGroupHearsContext } from "../../types/context";
import getUserId from "../../utils/getUserId";

async function ban_cmd(ctx: IGroupHearsContext) {
  const chat_id = ctx.chat.id;
  const target_id =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(6), chat_id) ||
    -1;
  if (target_id === -1) {
    return;
  }
  return void (await ctx.banChatMember(target_id).catch((e) => {}));
}

export { ban_cmd };
