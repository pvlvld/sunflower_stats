import { DefaultChartSettings, IChartSettings } from "./chartSettings.js";
import { IDBPoolManager } from "./poolManager.js";
import { isPremium } from "../utils/isPremium.js";

const _defaultUserSettings = { ...DefaultChartSettings };

const DefaultUserSettings = Object.freeze(_defaultUserSettings);

type IUserSettings = typeof _defaultUserSettings;

class DbUserSettingWrapper {
    private _poolManager: IDBPoolManager;

    constructor(poolManager: IDBPoolManager) {
        this._poolManager = poolManager;
    }

    public async get(user_id: number) {
        // TODO: reset to default in db if no premium
        let settings_db: undefined | IChartSettings;
        try {
            settings_db = (
                await this._poolManager.getPoolRead.query(
                    `SELECT line_color, font_color, locale FROM users WHERE user_id = ${user_id};`
                )
            ).rows[0] as any;
        } catch (e) {
            console.error("Error fetching user settings:", e);
        }

        if (!settings_db) {
            return DefaultChartSettings;
        }

        if (
            settings_db.line_color !== DefaultChartSettings.line_color ||
            settings_db.font_color !== DefaultChartSettings.font_color
        ) {
            if (!(await isPremium(user_id))) {
                await this.set(user_id, Object.assign(settings_db, { ...DefaultChartSettings }));
                return DefaultChartSettings;
            }
        }
        return settings_db;
    }

    public async set(user_id: number, settings: IUserSettings) {
        try {
            void (await this._poolManager.getPoolWrite.query(`UPDATE users
      SET line_color = '${settings.line_color}',
          font_color = '${settings.font_color}'
      WHERE user_id = ${user_id};
      `));
        } catch (error) {
            console.error(error);
        }
    }
}

export { DbUserSettingWrapper, IUserSettings, DefaultUserSettings };
