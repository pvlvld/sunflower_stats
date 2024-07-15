import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { DefaultChatSettings } from "../cache/chatSettingsCache.js";
import type { IChatSettings } from "../types/settings.js";
import { IDBPoolManager } from "./poolManager.js";

class DbChatSettingWrapper {
  private _poolManager: IDBPoolManager;

  constructor(poolManager: IDBPoolManager) {
    this._poolManager = poolManager;
  }

  public async get(chat_id: number) {
    let settings_db: undefined | IChatSettings;
    try {
      settings_db = (
        await this._poolManager.getPoolRead.query(
          `SELECT charts, statsadminsonly, usechatbgforall, selfdestructstats FROM chats WHERE chat_id = ${chat_id};`
        )
      ).rows[0] as IChatSettings | undefined;
    } catch (e) {
      console.error("Error fetching chat settings:", e);
    }

    if (!settings_db) {
      return { ...DefaultChatSettings };
    }

    return { ...settings_db };
  }

  public async set(chat_id: number, new_settings: Partial<IChatSettings>) {
    const settings = await getCachedOrDBChatSettings(chat_id);
    Object.assign(settings, new_settings);
    try {
      void (await this._poolManager.getPoolWrite.query(`UPDATE chats
      SET charts = ${settings.charts},
          statsadminsonly = ${settings.statsadminsonly},
          usechatbgforall = ${settings.usechatbgforall},
          line_color = ${settings.line_color},
          font_color = ${settings.font_color}
      WHERE chat_id = ${chat_id};
      `));
    } catch (error) {
      console.error(error);
    }
  }
}

export { DbChatSettingWrapper };
