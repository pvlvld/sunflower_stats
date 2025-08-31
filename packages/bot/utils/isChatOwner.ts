import cacheManager from "../cache/cache.js";
import cfg from "../config.js";

async function isChatOwner(chat_id: number, user_id: number): Promise<boolean> {
    if (cfg.ADMINS.includes(user_id)) {
        return true;
    }

    if (cacheManager.ChatAdminsCache.isCached(chat_id) === false) {
        await cacheManager.ChatAdminsCache.updateAdmins(chat_id);
    }

    return cacheManager.ChatAdminsCache.isCreator(chat_id, user_id);
}

export default isChatOwner;
