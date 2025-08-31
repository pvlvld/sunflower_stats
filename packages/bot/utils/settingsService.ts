import cacheManager from "../cache/cache.js";
import { DefaultChatSettings } from "../consts/defaultChatSettings.js";
import { DefaultUserSettings } from "../consts/defaultUserSettings.js";
import { Database } from "../db/db.js";

class SettingsService {
    private static instance: SettingsService;

    private constructor(private cache: typeof cacheManager) {}

    public static getInstance(cache = cacheManager): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService(cache);
        }
        return SettingsService.instance;
    }

    public async getChatSettings(chat_id: number) {
        let chatSettings = this.cache.ChatSettingsCache.get(chat_id);

        if (chatSettings === undefined) {
            chatSettings = await Database.chat.settings.get(chat_id);

            if (chatSettings === undefined) {
                chatSettings = { ...DefaultChatSettings };
            }

            void cacheManager.ChatSettingsCache.set(chat_id, chatSettings);
        }

        return chatSettings;
    }

    public async getUserSettings(user_id: number) {
        let userSettings = this.cache.UserSettingsCache.get(user_id);

        if (userSettings === undefined) {
            userSettings = await Database.user.settings.get(user_id);

            if (userSettings === undefined) {
                userSettings = { ...DefaultUserSettings };
            }

            void cacheManager.UserSettingsCache.set(user_id, userSettings);
        }

        return userSettings;
    }
}

export const settingsService = SettingsService.getInstance();
