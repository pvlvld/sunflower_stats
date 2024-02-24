import { MyContext } from "../types/context";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { CommandContext } from "grammy";

async function del_user_active(
  ctx: CommandContext<MyContext>,
  active: YAMLWrapper<IActive>
) {
  const chatMember = await ctx
    .getChatMember(ctx.from?.id || -1)
    .catch((e) => {});
  if (!chatMember || chatMember.status != "creator") {
    ctx.reply("❌ Щось пішло не так або ви не є власником чату");
    return;
  }
  if (
    ctx.msg.reply_to_message?.from?.id &&
    active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id]
  ) {
    delete active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id];
    ctx.reply(
      `✅ Успішно видалено ${
        active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id]?.name
      } з активу та приховано зі статистики.`
    );
    return;
  }
  ctx.reply("❌ Цього користувача немає в активі.");
}

export default del_user_active;
