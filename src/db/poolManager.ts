import pg from "pg";
import cfg from "../config.js";
class PgSQLPoolManager {
    private config: pg.PoolConfig;
    private poolRead!: pg.Pool;
    private poolWrite!: pg.Pool;
    private _isReady: boolean;

    constructor(config: pg.PoolConfig) {
        this.config = config;
        this._isReady = false;
    }

    get isReady() {
        return this._isReady;
    }

    async createPool() {
        if (this._isReady) return;
        this._isReady = true;
        this.poolRead = new pg.Pool(this.config);
        this.poolWrite = new pg.Pool(this.config);
        await this.poolRead.query("SELECT 1");
    }

    get getPoolRead() {
        if (this._isReady) {
            return this.poolRead;
        }
        throw new Error("Pool was not created.");
    }

    get getPoolWrite() {
        if (this._isReady) {
            return this.poolWrite;
        }
        throw new Error("Pool was not created.");
    }

    async shutdown() {
        await this.poolRead.end();
        await this.poolWrite.end();
    }

    public getPoolsQueueStatus() {
        return { read: this.poolRead.waitingCount, write: this.poolWrite.waitingCount };
    }
}

type IDBPoolManager = PgSQLPoolManager;

const DBPoolManager = new PgSQLPoolManager({
    host: cfg.DB_HOST,
    database: cfg.DB_DATABASE,
    user: cfg.DB_USER,
    password: cfg.DB_PASSWORD,
    max: 15,
});

export { IDBPoolManager, DBPoolManager };
