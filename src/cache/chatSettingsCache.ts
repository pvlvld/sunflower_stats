import { DefaultChatSettings } from "../sonsts/defaultChatSettings.js";
import type { IChatSettings } from "../types/settings.js";

class ChatSettingsCache {
    private _settingsCache: Record<number, IChatSettings | undefined>;

    constructor() {
        this._settingsCache = {};
    }

    public get(chat_id: number): IChatSettings | undefined {
        return this._settingsCache[chat_id];
    }

    public set(chat_id: number, settings: Partial<IChatSettings> | undefined): IChatSettings {
        if (this._settingsCache[chat_id] === undefined) {
            this._settingsCache[chat_id] = { ...DefaultChatSettings };
        }

        if (settings) {
            this._settingsCache[chat_id] = {
                ...this._settingsCache[chat_id],
                ...settings,
            };
        }

        return this._settingsCache[chat_id];
    }

    public get size() {
        return Object.keys(this._settingsCache).length;
    }
}

export { ChatSettingsCache };
