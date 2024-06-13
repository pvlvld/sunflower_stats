import getUserId from "../utils/getUserId";
import type { IGroupHearsContext } from "../types/context";
import cfg from "../config";
import Escape from "../utils/escape";
import { active } from "../data/active";

async function del_user_active(ctx: IGroupHearsContext) {
  const chatMember = await ctx.getChatMember(ctx.from?.id || -1).catch(() => {});
  if (chatMember?.status === "creator" || cfg.ADMINS.includes(ctx.from?.id || -1)) {
    const userId =
      ctx.msg.reply_to_message?.from?.id ||
      getUserId((ctx.msg.text ?? ctx.msg.caption).slice(13), ctx.chat.id) ||
      -1;

    if (userId !== -1 && active.data[ctx.chat.id]?.[userId]) {
      const targetName = active.data[ctx.chat.id]![userId]!.name as string;
      delete active.data[ctx.chat.id]?.[userId];
      await ctx
        .reply(
          `✅ Успішно видалено ${Escape.html(targetName)} з активу та приховано зі статистики.`,
          { parse_mode: "HTML" }
        )
        .catch((e) => console.error(e));
      return;
    } else {
      await ctx.reply("❌ Користувача не знайдено").catch((e) => {});
      return;
    }
  }

  await ctx.reply("❌ Щось пішло не так або ви не є власником чату");
  return;
}

export default del_user_active;
