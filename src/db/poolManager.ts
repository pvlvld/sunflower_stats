import pg from "pg";
import cfg from "../config.js";
class PgSQLPoolManager {
    private config: pg.PoolConfig;
    private pool!: pg.Pool;
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
        this.pool = new pg.Pool(this.config);
        await this.pool.query("SELECT 1");
    }

    get getPoolRead() {
        if (this._isReady) {
            return this.pool;
        }
        throw new Error("Pool was not created.");
    }

    get getPoolWrite() {
        if (this._isReady) {
            return this.pool;
        }
        throw new Error("Pool was not created.");
    }

    async shutdown() {
        await this.pool.end();
    }

    public getPoolsQueueStatus() {
        return this.pool.waitingCount;
    }
}

type IDBPoolManager = PgSQLPoolManager;

const DBPoolManager = new PgSQLPoolManager({
    host: cfg.DB_HOST,
    database: cfg.DB_DATABASE,
    user: cfg.DB_USER,
    password: cfg.DB_PASSWORD,
    max: 20,
});

export { IDBPoolManager, DBPoolManager };
