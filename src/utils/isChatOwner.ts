import type { IChatAdmin } from "../cache/chatAdminsCache";
import cacheManager from "../cache/cache";
import cfg from "../config";
import bot from "../bot";

async function isChatOwner(chat_id: number, user_id: number): Promise<boolean> {
  if (cfg.ADMINS.includes(user_id)) {
    return true;
  }

  if (cacheManager.ChatAdminsCache.isCreator(chat_id, user_id)) {
    return true;
  }

  try {
    const apiAdmins = await bot.api.getChatAdministrators(chat_id);
    const admins: IChatAdmin[] = [];
    for (const admin of apiAdmins) {
      admins.push({ user_id: admin.user.id, status: admin.status });
    }
    cacheManager.ChatAdminsCache.setAdmins(chat_id, admins);

    return cacheManager.ChatAdminsCache.isCreator(chat_id, user_id);
  } catch (e) {
    return false;
  }
}

export default isChatOwner;
