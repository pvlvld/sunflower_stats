import { MyContext } from "../types/context";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { HearsContext } from "grammy";
import getUserId from "../utils/getUserId";
import parseCmdArgs from "../utils/parseCmdArgs";

const ADMINS = (process.env.ADMINS?.split(" ") || []).map((id) => Number(id));

async function del_user_active(
  ctx: HearsContext<MyContext>,
  active: YAMLWrapper<IActive>
) {
  const chatMember = await ctx
    .getChatMember(ctx.from?.id || -1)
    .catch(() => {});
  if (chatMember?.status === "creator" || ADMINS.includes(ctx.from?.id || -1)) {
    const userId =
      ctx.msg.reply_to_message?.from?.id ||
      getUserId(
        (ctx.msg.text ?? ctx.msg.caption).slice(13),
        ctx.chat.id,
        active
      ) ||
      -1;

    if (userId !== -1 && active.data[ctx.chat.id]?.[userId]) {
      await ctx.reply(
        `✅ Успішно видалено ${
          active.data[ctx.chat.id]?.[userId]?.name
        } з активу та приховано зі статистики.`
      );
      delete active.data[ctx.chat.id]?.[userId];
      return;
    } else {
      await ctx.reply("❌ Користувача не знайдено");
      return;
    }
  }

  await ctx.reply("❌ Щось пішло не так або ви не є власником чату");
  return;
}

export default del_user_active;
