import pg from "pg";
import { DbStatsWrapper } from "./stats";
import { DbChatSettingWrapper } from "./chatSettings";
import { DBPoolManager, IDBPoolManager } from "./poolManager";
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT4, parseInt);

class DatabaseWrapper {
  public poolManager: IDBPoolManager;
  public stats: DbStatsWrapper;
  public chatSettings: DbChatSettingWrapper;

  constructor() {
    this.poolManager = DBPoolManager;

    if (!this.poolManager.isReady) {
      throw new Error("DBPoolManager was not initiated!");
    }

    this.stats = new DbStatsWrapper(this.poolManager);
    this.chatSettings = new DbChatSettingWrapper(this.poolManager);
  }
}

const Database = new DatabaseWrapper();

export { Database };
