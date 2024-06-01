import type { IChatSettings } from "../types/settings";

class ChatSettingsCache {
  private _defaultChatSettings: IChatSettings;

  private _settingsCache: Record<number, IChatSettings | undefined>;

  constructor() {
    this._defaultChatSettings = {
      charts: true,
      statsadminsonly: false,
      usechatbgforall: false,
    };

    this._settingsCache = {};
  }

  public async get(chat_id: number): Promise<IChatSettings | undefined> {
    return this._settingsCache[chat_id];
  }

  public set(chat_id: number, settings: Partial<IChatSettings> | undefined): void {
    if (this._settingsCache[chat_id] === undefined) {
      this._settingsCache[chat_id] = { ...this._defaultChatSettings };
    }

    if (settings) {
      this._settingsCache[chat_id] = {
        ...this._settingsCache[chat_id]!,
        ...settings,
      };
    }
  }
}

export { ChatSettingsCache };
