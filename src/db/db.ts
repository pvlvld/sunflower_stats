import { DBPoolManager, IDBPoolManager } from "./poolManager.js";
import { DbChatSettingWrapper } from "./chatSettings.js";
import { DbUserSettingWrapper } from "./userSettings.js";
import { DBStatsWrapper } from "./stats.js";
import pg from "pg";

pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT4, parseInt);

await DBPoolManager.createPool();
class DatabaseWrapper {
    public poolManager: IDBPoolManager;
    public stats: DBStatsWrapper;
    public chatSettings: DbChatSettingWrapper;
    public userSettings: DbUserSettingWrapper;

    constructor() {
        this.poolManager = DBPoolManager;

        if (!this.poolManager.isReady) {
            throw new Error("DBPoolManager was not initiated!");
        }

        this.stats = new DBStatsWrapper(this.poolManager);
        this.chatSettings = new DbChatSettingWrapper(this.poolManager);
        this.userSettings = new DbUserSettingWrapper(this.poolManager);
    }
}

const Database = new DatabaseWrapper();

export { Database };
