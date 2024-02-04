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

class MySql {
  private config: mysql.ConnectionOptions;
  private connection!: mysql.Connection;

  constructor(config: mysql.ConnectionOptions) {
    this.config = config;
  }

  async createConnection() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.config);
    await this.connection.query("SELECT 1");
  }

  get getConnection() {
    if (!this.connection) {
      throw new Error("Connection was not created.");
    }
    return this.connection;
  }
}

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: process.env.DB_CHARSET,
  connectionLimit: 10,
};

export type IMySQL = typeof MySql;

const MySQLConnector = new MySql(config);

export default MySQLConnector;
