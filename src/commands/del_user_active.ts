import { MyContext } from "../types/context";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { CommandContext } from "grammy";
import getUserId from "../utils/getUserId";
import parseCmdArgs from "../utils/parseCmdArgs";

const ADMINS = (process.env.ADMINS?.split(" ") || []).map((id) => Number(id));

async function del_user_active(
  ctx: CommandContext<MyContext>,
  active: YAMLWrapper<IActive>
) {
  const chatMember = await ctx
    .getChatMember(ctx.from?.id || -1)
    .catch(() => {});
  if (
    !chatMember ||
    chatMember.status != "creator" ||
    !ADMINS.includes(ctx.from?.id || -1)
  ) {
    await ctx.reply("❌ Щось пішло не так або ви не є власником чату");
    return;
  }

  if (ctx.msg.reply_to_message?.from?.id) {
    if (active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id]) {
      await ctx.reply(
        `✅ Успішно видалено ${
          active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id]?.name
        } з активу та приховано зі статистики.`
      );
      delete active.data[ctx.chat.id]?.[ctx.msg.reply_to_message.from.id];
      return;
    }
  } else {
    const wantedUser = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption)[0];
    if (!wantedUser) {
      await ctx.reply("❌ Користувача не знайдено.");
      return;
    }
    const wantedUserId = getUserId(wantedUser, ctx.chat.id, active);

    if (wantedUserId === -1) {
      await ctx.reply("❌ Користувача не знайдено.");
      return;
    }

    await ctx.reply(
      `✅ Успішно видалено ${
        active.data[ctx.chat.id]?.[wantedUserId]?.name
      } з активу та приховано зі статистики.`
    );
    delete active.data[ctx.chat.id]?.[wantedUserId];
    return;
  }

  await ctx.reply("❌ Цього користувача немає в активі.");
}

export default del_user_active;
