import type { IChatAdmin } from "../cache/chatAdminsCache";
import cacheManager from "../cache/cache";
import bot from "../bot";

async function isChatAdmin(chat_id: number, user_id: number): Promise<boolean> {
  if (cacheManager.ChatAdminsCache.isAdmin(chat_id, user_id)) {
    return true;
  }

  try {
    const apiAdmins = await bot.api.getChatAdministrators(chat_id);
    const admins: IChatAdmin[] = [];
    for (const admin of apiAdmins) {
      admins.push({ user_id: admin.user.id, status: admin.status });
    }
    cacheManager.ChatAdminsCache.setAdmins(chat_id, admins);

    return admins.some((a) => a.user_id === user_id);
  } catch (e) {
    return false;
  }
}

export { isChatAdmin };
