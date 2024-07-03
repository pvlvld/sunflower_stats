import { cacheChatAdmins } from "./cacheChatAdmins";
import cacheManager from "../cache/cache";
import cfg from "../config";

async function isChatAdmin(chat_id: number, user_id: number): Promise<boolean> {
  if (cfg.ADMINS.includes(user_id)) {
    return true;
  }

  if (cacheManager.ChatAdminsCache.isCached(chat_id) === false) {
    await cacheChatAdmins(chat_id);
  }

  return cacheManager.ChatAdminsCache.isAdmin(chat_id, user_id);
}

export { isChatAdmin };
