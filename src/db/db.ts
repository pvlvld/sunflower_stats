import pg, { Pool, type PoolConfig } from "pg";
import cfg from "../config";
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT4, parseInt);
export type IPgSQLPoolManager = PgSQLPoolManager;

class PgSQLPoolManager {
  private config: PoolConfig;
  private poolRead!: Pool;
  private poolWrite!: Pool;

  constructor(config: PoolConfig) {
    this.config = config;
  }

  async createPool() {
    if (this.poolRead && this.poolWrite) return;
    this.poolRead = new Pool(this.config);
    this.poolWrite = new Pool(this.config);
    await this.poolRead.query("SELECT 1");
  }

  get getPoolRead() {
    if (!this.poolRead) {
      throw new Error("Pool was not created.");
    }
    return this.poolRead;
  }

  get getPoolWrite() {
    if (!this.poolWrite) {
      throw new Error("Pool was not created.");
    }
    return this.poolWrite;
  }

  async shutdown() {
    await this.poolRead.end();
    await this.poolWrite.end();
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
