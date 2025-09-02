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
                    `SELECT charts, statsadminsonly, usechatbgforall, selfdestructstats, userstatslink, line_color, font_color, locale FROM chats WHERE chat_id = ${chat_id};`,
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

        return settings_db;
    }

    public async getChatsLocaleWithActiveUsersSinceNDays(
        nDays: number,
    ): Promise<Array<[number, string]>> {
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
