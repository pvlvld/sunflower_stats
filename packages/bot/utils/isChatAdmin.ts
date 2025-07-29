import { cacheChatAdmins } from "./cacheChatAdmins.js";
import cacheManager from "../cache/cache.js";
import cfg from "../config.js";

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
