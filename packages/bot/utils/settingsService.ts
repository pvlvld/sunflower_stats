import cacheManager from "../cache/cache.js";
import { DefaultChatSettings } from "../consts/defaultChatSettings.js";
import { DefaultUserSettings } from "../consts/defaultUserSettings.js";
import { Database } from "../db/db.js";

export class SettingsService {
    private static instance: SettingsService;

    private constructor(
        private cache: typeof cacheManager,
        private db: typeof Database,
    ) {}

    public static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService(cacheManager, Database);
        }
        return SettingsService.instance;
    }

    public async getChatSettings(chat_id: number) {
        let chatSettings = this.cache.ChatSettingsCache.get(chat_id);

        if (chatSettings === undefined) {
            chatSettings = await this.db.chat.settings.get(chat_id);

            if (chatSettings === undefined) {
                chatSettings = { ...DefaultChatSettings };
            }

            void this.cache.ChatSettingsCache.set(chat_id, chatSettings);
        }

        return chatSettings;
    }

    public async getUserSettings(user_id: number) {
        let userSettings = this.cache.UserSettingsCache.get(user_id);

        if (userSettings === undefined) {
            userSettings = await this.db.user.settings.get(user_id);

            if (userSettings === undefined) {
                userSettings = { ...DefaultUserSettings };
            }

            void this.cache.UserSettingsCache.set(user_id, userSettings);
        }

        return userSettings;
    }

    public setChatSettings(chat_id: number, settings: Partial<typeof DefaultChatSettings>) {
        const currentSettings = this.cache.ChatSettingsCache.get(chat_id);
        if (currentSettings) {
            this.cache.ChatSettingsCache.set(chat_id, settings);
        }
    }

    public setUserSettings(user_id: number, settings: Partial<typeof DefaultUserSettings>) {
        const currentSettings = this.cache.UserSettingsCache.get(user_id);
        if (currentSettings) {
            this.cache.UserSettingsCache.set(user_id, settings);
        }
    }
}
