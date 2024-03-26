import { Pool, type PoolConfig } from "pg";

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_DATABASE
) {
  throw new Error("Provide database env credentials.");
}

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
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 15,
});

export default DBPoolManager;
