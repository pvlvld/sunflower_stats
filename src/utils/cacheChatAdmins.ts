import type { IChatAdmin } from "../cache/chatAdminsCache";
import cacheManager from "../cache/cache";
import bot from "../bot";

async function cacheChatAdmins(chat_id: number) {
  const apiAdmins = await bot.api.getChatAdministrators(chat_id).catch((e) => {
    console.error("Error caching chat admins.", e);
  });
  const admins: IChatAdmin[] = [];

  if (apiAdmins === undefined) {
    return admins;
  }

  for (const admin of apiAdmins) {
    admins.push({ user_id: admin.user.id, status: admin.status });
  }
  cacheManager.ChatAdminsCache.setAdmins(chat_id, admins);

  return admins;
}

export { cacheChatAdmins };
