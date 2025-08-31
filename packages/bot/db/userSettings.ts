import { IDBPoolManager } from "./poolManager.js";
import { isPremium } from "../utils/isPremium.js";
import { DefaultUserSettings, IUserSettings } from "../consts/defaultUserSettings.js";

class DbUserSettingWrapper {
    private _poolManager: IDBPoolManager;

    constructor(poolManager: IDBPoolManager) {
        this._poolManager = poolManager;
    }

    public async get(user_id: number) {
        let settings_db: undefined | IUserSettings;
        try {
            settings_db = (
                await this._poolManager.getPoolRead.query(
                    `SELECT line_color, font_color, locale FROM users WHERE user_id = ${user_id};`,
                )
            ).rows[0] as any;
        } catch (e) {
            console.error("Error fetching user settings:", e);
        }

        if (!settings_db) return DefaultUserSettings;

        if (
            settings_db.line_color !== DefaultUserSettings.line_color ||
            settings_db.font_color !== DefaultUserSettings.font_color
        ) {
            if (!(await isPremium(user_id))) {
                settings_db.line_color = DefaultUserSettings.line_color;
                settings_db.font_color = DefaultUserSettings.font_color;
                this.set(user_id, settings_db);
                return settings_db;
            }
        }
        return settings_db;
    }

    public async set(user_id: number, settings: Partial<IUserSettings>) {
        try {
            const fields = [];
            const values = [];
            let idx = 2;

            if (settings.line_color) {
                fields.push(`line_color = $${idx++}`);
                values.push(settings.line_color);
            }
            if (settings.font_color) {
                fields.push(`font_color = $${idx++}`);
                values.push(settings.font_color);
            }
            if (settings.locale) {
                fields.push(`locale = $${idx++}`);
                values.push(settings.locale);
            }

            if (fields.length === 0) return;

            await this._poolManager.getPoolWrite.query(
                `
                UPDATE users
                SET ${fields.join(", ")}
                WHERE user_id = $1
                `,
                [user_id, ...values],
            );
        } catch (error) {
            console.error(error);
        }
    }
}

export { DbUserSettingWrapper, IUserSettings };
