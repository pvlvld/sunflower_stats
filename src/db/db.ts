import mysql from "mysql2/promise";

if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_DATABASE ||
  !process.env.DB_CHARSET
) {
  throw new Error("Provide database env credentials.");
}

class MySQLPoolManager {
  private config: mysql.ConnectionOptions;
  private pool!: mysql.Pool;

  constructor(config: mysql.ConnectionOptions) {
    this.config = config;
  }

  async createPool() {
    if (this.pool) return;
    this.pool = mysql.createPool(this.config);
    await this.pool.query("SELECT 1");
  }

  get getPool() {
    if (!this.pool) {
      throw new Error("Pool was not created.");
    }
    return this.pool;
  }
}

const DBPoolManager = new MySQLPoolManager({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: process.env.DB_CHARSET,
});

export default DBPoolManager;
