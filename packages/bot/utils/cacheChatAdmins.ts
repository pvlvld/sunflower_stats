import type { IChatAdmin } from "../cache/chatAdminsCache.js";
import cacheManager from "../cache/cache.js";
import bot from "../bot.js";
import { GrammyError } from "grammy";

async function cacheChatAdmins(chat_id: number) {
    const apiAdmins = await bot.api.getChatAdministrators(chat_id).catch(async (e) => {
        if (e instanceof GrammyError) {
            if (e.parameters.migrate_to_chat_id) {
                return await bot.api.getChatAdministrators(e.parameters.migrate_to_chat_id).catch((e) => {});
            }
        }

        console.error("Error caching chat admins.", e);
    });
    const admins: IChatAdmin[] = [];

    if (apiAdmins === undefined) {
        return admins;
    }

    for (const admin of apiAdmins) {
        admins.push({ user_id: admin.user.id, status: admin.status });
    }

    return cacheManager.ChatAdminsCache.setAdmins(chat_id, admins);
}

export { cacheChatAdmins };
