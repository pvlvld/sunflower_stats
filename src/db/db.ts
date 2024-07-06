import { DBPoolManager, IDBPoolManager } from "./poolManager.js";
import { DbChatSettingWrapper } from "./chatSettings.js";
import { DBStatsWrapper } from "./stats.js";
import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT4, parseInt);

class DatabaseWrapper {
  public poolManager: IDBPoolManager;
  public stats: DBStatsWrapper;
  public chatSettings: DbChatSettingWrapper;

  constructor() {
    this.poolManager = DBPoolManager;

    if (!this.poolManager.isReady) {
      throw new Error("DBPoolManager was not initiated!");
    }

    this.stats = new DBStatsWrapper(this.poolManager);
    this.chatSettings = new DbChatSettingWrapper(this.poolManager);
  }
}

const Database = new DatabaseWrapper();

export { Database };
