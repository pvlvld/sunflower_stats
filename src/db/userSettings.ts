import { DefaultChartSettings, IChartSettings } from "./chartSettings.js";
import { IDBPoolManager } from "./poolManager.js";

const _defaultUserSettings = { ...DefaultChartSettings };

const DefaultUserSettings = Object.freeze(_defaultUserSettings);

type IUserSettings = typeof _defaultUserSettings;

class DbUserSettingWrapper {
  private _poolManager: IDBPoolManager;

  constructor(poolManager: IDBPoolManager) {
    this._poolManager = poolManager;
  }

  public async get(user_id: number) {
    let settings_db: any;
    try {
      settings_db = (
        await this._poolManager.getPoolRead.query(
          `SELECT line_color, font_color FROM users WHERE user_id = ${user_id};`
        )
      ).rows[0] as any;
    } catch (error) {}

    if (settings_db && settings_db.line_color) {
      return settings_db as IChartSettings;
    } else {
      return DefaultChartSettings;
    }
  }

  public async set(user_id: number, settings: IUserSettings) {
    try {
      void (await this._poolManager.getPoolWrite.query(`UPDATE users
      SET line_color = ${settings.line_color},
          font_color = ${settings.font_color}
      WHERE user_id = ${user_id};
      `));
    } catch (error) {
      console.error(error);
    }
  }
}

export { DbUserSettingWrapper, IUserSettings, DefaultUserSettings };
