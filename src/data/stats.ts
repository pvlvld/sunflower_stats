import { IStats } from "../types/stats";
import YAMLWrapper from "./YAMLWrapper";
import mysql2 from "mysql2/promise";
import IActive from "./active";
import formattedDate from "../utils/date";
import bot from "../bot";

export class TodayStats extends YAMLWrapper<IStats> {
  private dbPool: mysql2.Pool;
  private writeConnection!: mysql2.Connection;
  private active: YAMLWrapper<IActive>;

  constructor(
    filename: () => string,
    dirrectory: string,
    dbPool: mysql2.Pool,
    active: YAMLWrapper<IActive>
  ) {
    super(filename, dirrectory);
    this.dbPool = dbPool;
    this.active = active;
  }

  private async getWriteConnection() {
    if (!this.writeConnection) {
      this.writeConnection = await mysql2.createConnection({
        namedPlaceholders: true,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        charset: process.env.DB_CHARSET,
      });
    }
    return this.writeConnection;
  }

  async writeStatsToDB() {
    const connection = await this.getWriteConnection();
    bot.api.sendMessage("-1001898242958", "Запис стати в бд");
    const date = formattedDate.yesterday;
    for (const chatId in this.data) {
      for (const userId in this.data[chatId]) {
        const query = this.dbPool.format(
          `INSERT INTO stats_day_statistics (chat_id, user_id, name, username, count, date) VALUES (${chatId}, ${userId}, ?, ?, ?, "${date}")`,
          [
            this.active.data[chatId]?.[userId]?.name || "Невідомо",
            this.active.data[chatId]?.[userId]?.username || null,
            this.data[chatId]?.[userId] || 0,
          ]
        );
        try {
          connection.query(query);
        } catch (error) {
          console.error(error);
        }
      }
    }
    console.log("saved");
  }
}

export default TodayStats;
