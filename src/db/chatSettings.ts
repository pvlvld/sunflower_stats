import type { IChatSettings } from "../types/settings";
import { IDBPoolManager } from "./poolManager";

class DbChatSettingWrapper {
  private _poolManager: IDBPoolManager;

  constructor(poolManager: IDBPoolManager) {
    this._poolManager = poolManager;
  }

  public async get(chat_id: number) {
    return (
      await this._poolManager.getPoolRead.query(
        `SELECT charts, statsadminsonly, usechatbgforall, selfdestructstats FROM chats WHERE chat_id = ${chat_id};`
      )
    ).rows[0] as IChatSettings | undefined;
  }

  public async set(chat_id: number, settings: IChatSettings) {
    try {
      void (await this._poolManager.getPoolWrite.query(`UPDATE chats
      SET charts = ${settings.charts},
          statsadminsonly = ${settings.statsadminsonly},
          usechatbgforall = ${settings.usechatbgforall}
      WHERE chat_id = ${chat_id};
      `));
    } catch (error) {
      console.error(error);
    }
  }
}

export { DbChatSettingWrapper };
