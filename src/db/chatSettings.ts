import type { IChatSettings } from "../types/settings";
import { IDBPoolManager } from "./poolManager";

class DbChatSettingWrapper {
  private _poolManager: IDBPoolManager;

  constructor(poolManager: IDBPoolManager) {
    this._poolManager = poolManager;
  }

  public async get(chat_id: number) {
    (
      await this._poolManager.getPoolRead.query(
        `SELECT charts, statsadminsonly, usechatbgforall FROM chats WHERE chat_id = ${chat_id};`
      )
    ).rows[0] as IChatSettings | undefined;
  }

  public set(chat_id: number, settings: IChatSettings) {
    this._poolManager.getPoolWrite.query(`UPDATE chats
    SET charts = ${settings.charts},
        statsadminsonly = ${settings.statsadminsonly},
        usechatbgforall = ${settings.usechatbgforall}
    WHERE chat_id = ${chat_id};
    `);
  }
}

export { DbChatSettingWrapper };
