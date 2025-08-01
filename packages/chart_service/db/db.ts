import { config } from "../consts/config.js";
import pg from "pg";

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

    get getPool() {
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

const DBPoolManager = new PgSQLPoolManager({
    host: config.DB_HOST,
    database: config.DB_DATABASE,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: 3,
});

export { DBPoolManager };
