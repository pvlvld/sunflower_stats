import type { IChatSettings } from "../types/settings";
import { DefaultChatSettings } from "../cache/chatSettingsCache";
import cacheManager from "../cache/cache";
import { Database } from "../db/db";
import { IGroupContext } from "../types/context";

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

async function getChatSettingsMessageText(ctx: IGroupContext) {
  const chatSettings = await getCachedOrDBChatSettings(ctx.chat.id);

  return `
${ctx.chat.title}
Налаштування Соняшник | Статистика

Графіки статистики ${chatSettings.charts ? "✅" : "❌"}
Фон чату для команд !я та !ти ${chatSettings.usechatbgforall ? "✅" : "❌"}
Команди статистики лише для адмінів ${chatSettings.statsadminsonly ? "✅" : "❌"}
Самознищення повідомлень ${chatSettings.selfdestructstats ? "✅" : "❌"}
`;
}

export { getCachedOrDBChatSettings, getChatSettingsMessageText };
