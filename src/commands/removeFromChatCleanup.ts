import type { IGroupTextContext } from "../types/context";
import { GrammyError } from "grammy";
import { active } from "../data/active";
import cacheManager from "../cache/cache";
import getUserId from "../utils/getUserId";
import isChatOwner from "../utils/isChatOwner";

async function removeFromChatCleanup(ctx: IGroupTextContext): Promise<void> {
  const chat_id = ctx.chat.id;
  if (!(await isChatOwner(chat_id, ctx.from.id))) return;

  if ((ctx.msg.text || ctx.msg.caption) === "!рест") {
    return void (await ctx
      .reply(
        '🛏 <b>!рест</b>: захистити людину від чистки (за ім\'ям, юзернеймом або у відповідь на повідомлення).\n\nЯкщо викликати команду до чистки, тоді бот спробує зробити людину адміністратором без прав та встановити їй підпис "рест".\nЯкщо викликати команду після команди !чистка, тоді бот видалить людину зі списку.'
      )
      .catch((e) => {}));
  }

  const cacheKey = `cleanup_${chat_id}`;
  let targetMembers = cacheManager.TTLCache.get(cacheKey) as { user_id: number }[] | undefined;

  let targetId =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(6), chat_id);
  if (targetId === -1) {
    if (targetMembers) {
      cacheManager.TTLCache.set(`cleanup_${chat_id}`, targetMembers, 60 * 5);
    }
    return void (await ctx.reply("❌ Користувача не знайдено").catch((e) => {}));
  }

  if (!targetMembers) {
    // Try to promote target as an empty admin with with "рест" role
    switch (await setRestStatus(ctx, targetId)) {
      case "not enough rights set admin":
        return void (await ctx.reply(
          `Бот не має дозволу призначати адміністраторів.\nВидайте дозвіл або скористайтесь командою під час чистки.`
        ));

      case "not enough rights edit admin":
        return void (await ctx.reply(
          `${active.data[chat_id]?.[targetId]?.name} адмін, він не може бути видалений під час чистки та не потребує ресту.`
        ));

      case "success":
        return void (await ctx.reply(
          `✅ ${active.data[chat_id]?.[targetId]?.name} помічено як рест.`
        ));

      default:
        console.error("Unexpected setRestStatus output!");
        return;
    }
  }

  // Try to remove target from target members for the cleanup
  const startLength = targetMembers.length;
  targetMembers = targetMembers.filter((m) => m.user_id === targetId);
  if (targetMembers.length < startLength) {
    cacheManager.TTLCache.set(cacheKey, targetMembers, 5 * 60);
    return void (await ctx
      .reply(`✅ ${active.data[chat_id]?.[targetId]?.name} успішно виключено з чистки.`)
      .catch((e) => {}));
  }

  cacheManager.TTLCache.set(`cleanup_${chat_id}`, targetMembers, 60 * 5);
  return void (await ctx
    .reply("🤷🏻‍♀️ Схоже, що цього користувача немає в поточній чистці.")
    .catch((e) => {}));
}

async function setRestStatus(
  ctx: IGroupTextContext,
  targetId: number
): Promise<"not enough rights set admin" | "not enough rights edit admin" | "success"> {
  try {
    await ctx.promoteChatMember(targetId, { can_manage_chat: true });
  } catch (e) {
    if (e instanceof GrammyError && e.description.includes("not enough rights")) {
      return "not enough rights set admin" as const;
    }
  }

  try {
    await ctx.setChatAdministratorCustomTitle(targetId, "рест");
  } catch (e: any) {
    console.log(e.description);
    return "not enough rights edit admin";
  }

  return "success" as const;
}

export default removeFromChatCleanup;
