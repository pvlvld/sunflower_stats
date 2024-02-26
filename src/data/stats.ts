import { IStats } from "../types/stats";
import YAMLWrapper from "./YAMLWrapper";
import mysql2 from "mysql2/promise";
import formattedDate from "../utils/date";

export class TodayStats extends YAMLWrapper<IStats> {
  constructor(filename: () => string, dirrectory: string) {
    super(filename, dirrectory);
  }

  private async getWriteDBPool() {
    return mysql2.createPool({
      connectionLimit: 10,
      namedPlaceholders: true,
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      charset: process.env.DB_CHARSET,
    });
  }

  async writeStatsToDB() {
    const dbpool = await this.getWriteDBPool();

    const date = formattedDate.yesterday;
    const insertValues = [];

    for (const chatId in this.data) {
      for (const userId in this.data[chatId]) {
        const count = this.data[chatId]?.[userId] || 0;

        insertValues.push([chatId, userId, count, date]);
      }

      if (insertValues.length === 0) continue;

      try {
        // Prepare the bulk insert query
        const sql = `
          INSERT INTO stats_day_statistics (chat_id, user_id, count, date)
          VALUES ?
        `;
        const connection = await dbpool.getConnection();
        connection.query(sql, [insertValues]).then(() => {
          connection.release();
        });

        // console.log(`Saved chat: ${chatId}`);
      } catch (error) {
        console.error(error);
        console.log(insertValues);
      }
      insertValues.length = 0;
    }

    dbpool.end();
    console.log("Writed all chats stats!");
  }
}

export default TodayStats;
