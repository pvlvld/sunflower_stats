import pg, { Pool, type PoolConfig } from "pg";
import cfg from "../config";
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT4, parseInt);
export type IPgSQLPoolManager = PgSQLPoolManager;

class PgSQLPoolManager {
  private config: PoolConfig;
  private poolRead!: Pool;
  private poolWrite!: Pool;
  private _isReady: boolean;

  constructor(config: PoolConfig) {
    this.config = config;
    this._isReady = false;
  }

  get isReady() {
    return this._isReady;
  }

  async createPool() {
    if (this._isReady) return;
    this.poolRead = new Pool(this.config);
    this.poolWrite = new Pool(this.config);
    await this.poolRead.query("SELECT 1");
    this._isReady = true;
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
    return { read: this.poolRead.idleCount, write: this.poolWrite.idleCount };
  }
}

const DBPoolManager = new PgSQLPoolManager({
  host: cfg.DB_HOST,
  database: cfg.DB_DATABASE,
  user: cfg.DB_USER,
  password: cfg.DB_PASSWORD,
  max: 15,
});

export default DBPoolManager;
