import { IStats } from "../types/stats";
import YAMLWrapper from "./YAMLWrapper";
import formattedDate from "../utils/date";
import { Pool } from "pg";
import pgp from "pg-promise";

const myPgp = pgp({ capSQL: true });

export class TodayStats extends YAMLWrapper<IStats> {
  constructor(filename: () => string, dirrectory: string) {
    super(filename, dirrectory);
  }

  private async getWriteDBPool() {
    return new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      max: 10,
    });
  }

  async writeStatsToDB() {
    const dbpool = await this.getWriteDBPool();

    const date = formattedDate.yesterday;
    const insertValues = [];

    const cs = new myPgp.helpers.ColumnSet(
      ["chat_id", "user_id", "count", "date"],
      {
        table: "stats_day_statistics",
      }
    );

    for (const chatId in this.data) {
      for (const userId in this.data[chatId]) {
        const count = this.data[chatId]?.[userId] || 0;

        insertValues.push({ chat_id: chatId, user_id: userId, count, date });
      }

      if (insertValues.length === 0) continue;

      // Prepare the bulk insert query
      try {
        const query = myPgp.helpers.insert(insertValues, cs);
        const connection = await dbpool.connect();
        connection.query(query).then(() => {
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
