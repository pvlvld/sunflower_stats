import { DefaultChatSettings } from "../cache/chatSettingsCache.js";
import type { IChatSettings } from "../types/settings.js";
import type { IContext } from "../types/context.js";
import cacheManager from "../cache/cache.js";
import { Database } from "../db/db.js";

async function getCachedOrDBChatSettings(chat_id: number): Promise<IChatSettings> {
    let chatSettings = cacheManager.ChatSettingsCache.get(chat_id);

    if (chatSettings === undefined) {
        chatSettings = await Database.chatSettings.get(chat_id);

        if (chatSettings === undefined) {
            chatSettings = { ...DefaultChatSettings };
        }

        void cacheManager.ChatSettingsCache.set(chat_id, chatSettings);
    }

    return chatSettings;
}

async function getChatSettingsMessageText(ctx: IContext) {
    const chatSettings = await getCachedOrDBChatSettings(ctx.chat!.id);

    return `
${ctx.chat!.title}
${ctx.t("settings-message", {
    charts: chatSettings.charts ? "✅" : "❌",
    usechatbgforall: chatSettings.usechatbgforall ? "✅" : "❌",
    statsadminsonly: chatSettings.statsadminsonly ? "✅" : "❌",
    selfdestructstats: chatSettings.selfdestructstats ? "✅" : "❌",
    userstatslink: chatSettings.userstatslink ? "✅" : "❌",
})}
`;
}

export { getCachedOrDBChatSettings, getChatSettingsMessageText };
