import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { DefaultChartSettings } from "./chartSettings.js";
import type { Writeable } from "../types/utilityTypes.js";
import { IDBPoolManager } from "./poolManager.js";
import { isPremium } from "../utils/isPremium.js";
import { DefaultChatSettings, IChatSettings } from "../consts/defaultChatSettings.js";

class DbChatSettingWrapper {
    private _poolManager: IDBPoolManager;

    constructor(poolManager: IDBPoolManager) {
        this._poolManager = poolManager;
    }

    public async get(chat_id: number) {
        let settings_db: undefined | Writeable<IChatSettings>;
        try {
            settings_db = (
                await this._poolManager.getPoolRead.query(
                    `SELECT charts, statsadminsonly, usechatbgforall, selfdestructstats, userstatslink, line_color, font_color, locale FROM chats WHERE chat_id = ${chat_id};`
                )
            ).rows[0] as IChatSettings | undefined;
        } catch (e) {
            console.error("Error fetching chat settings:", e);
        }

        if (!settings_db) {
            return { ...DefaultChatSettings };
        }

        if (!settings_db.line_color) {
            settings_db.line_color = DefaultChartSettings.line_color;
        }

        if (!settings_db.font_color) {
            settings_db.font_color = DefaultChartSettings.font_color;
        }

        // TODO: INFINITE LOOP!
        // - Realize donate features reset in donate service itself
        // if (
        //   settings_db.line_color !== DefaultChartSettings.line_color ||
        //   settings_db.font_color !== DefaultChartSettings.font_color
        // ) {
        //   if (!(await isPremium(chat_id))) {
        //     await this.set(chat_id, Object.assign(settings_db, { ...DefaultChartSettings }));
        //   }
        // }

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
          line_color = '${settings.line_color}',
          font_color = '${settings.font_color}',
          userstatslink = '${settings.userstatslink}',
          selfdestructstats = '${settings.selfdestructstats}'
      WHERE chat_id = ${chat_id};
      `));
        } catch (error) {
            console.error(error);
        }
    }

    public async getChatsLocaleWithActiveUsersSinceNDays(nDays: number): Promise<Array<[number, string]>> {
        try {
            const result = await this._poolManager.getPoolRead.query({
                text: `SELECT c.chat_id, c.locale
                 FROM chats c
                 WHERE EXISTS (
                     SELECT 1
                     FROM stats_daily s
                     WHERE s.chat_id = c.chat_id
                       AND s.date >= CURRENT_DATE - INTERVAL '${nDays} days'
                 );`,
                rowMode: "array",
            });
            return result.rows as unknown as Array<[number, string]>;
        } catch (error) {
            console.error("Error fetching chats locale with active users:", error);
        }
        return [];
    }
}

export { DbChatSettingWrapper };
