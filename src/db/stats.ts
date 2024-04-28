import { Pool } from "pg";
import formattedDate, { type IFormattedRangeDateGetters } from "../utils/date";
import type { IDbChatUserStatsPeriods, IDbChatUserStats } from "../types/stats";
import DBPoolManager from "./db";

type IDateRanges = keyof IFormattedRangeDateGetters | [from: string, to: string];

class DbStatsWrapper {
  public chat;
  public user;
  public bot;

  constructor(poolRead: Pool, poolWrite: Pool) {
    this.chat = new DbChatStats(poolRead);
    this.user = new DbUserStats(poolRead, poolWrite);
    this.bot = new DbBotStats(poolRead);
  }
}

class DbUserStats {
  private poolRead: Pool;
  private poolWrite: Pool;

  constructor(poolRead: Pool, poolWrite: Pool) {
    this.poolRead = poolRead;
    this.poolWrite = poolWrite;
  }

  async all(chat_id: number, user_id: number): Promise<IDbChatUserStatsPeriods> {
    const query = `
    SELECT
    SUM(count)::INTEGER AS total,
    SUM(CASE WHEN date BETWEEN '${formattedDate.yearRange[0]}' AND '${formattedDate.yearRange[1]}' THEN count ELSE 0 END)::INTEGER AS year,
    SUM(CASE WHEN date BETWEEN '${formattedDate.monthRange[0]}' AND '${formattedDate.monthRange[1]}' THEN count ELSE 0 END)::INTEGER AS month,
    SUM(CASE WHEN date BETWEEN '${formattedDate.weekRange[0]}' AND '${formattedDate.weekRange[1]}' THEN count ELSE 0 END)::INTEGER AS week,
    SUM(CASE WHEN date = '${formattedDate.today}' THEN count ELSE 0 END)::INTEGER AS today
    FROM stats_daily
    WHERE chat_id = ${chat_id} AND user_id = ${user_id};
    `;

    try {
      return (await this.poolRead.query(query)).rows[0] as IDbChatUserStatsPeriods;
    } catch (error) {
      console.error(error);
      return {} as IDbChatUserStatsPeriods;
    }
  }

  async countUserMessage(chat_id: number, user_id: number) {
    try {
      return void (await this.poolWrite.query(`SELECT update_stats_daily(${chat_id}, ${user_id})`));
    } catch (error) {
      console.error(error);
    }
  }
}

class DbChatStats {
  private dbPool: Pool;

  constructor(dbPool: Pool) {
    this.dbPool = dbPool;
  }

  async today(chat_id: number): Promise<IDbChatUserStats[]> {
    try {
      const query = `
      SELECT user_id, SUM(count)::INTEGER  AS count
      FROM stats_daily
      WHERE chat_id = ${chat_id} AND date = '${formattedDate.today}'
      GROUP BY user_id
      ORDER BY count DESC;
        `;
      return (await this.dbPool.query(query)).rows as IDbChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDbChatUserStats[];
    }
  }

  async yesterday(chat_id: number): Promise<IDbChatUserStats[]> {
    try {
      const query = `
      SELECT user_id, SUM(count)::INTEGER  AS count
      FROM stats_daily
      WHERE chat_id = ${chat_id} AND date = '${formattedDate.yesterday}'
      GROUP BY user_id
      ORDER BY count DESC;
        `;
      return (await this.dbPool.query(query)).rows as IDbChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDbChatUserStats[];
    }
  }

  async inRage(chat_id: number, range: IDateRanges) {
    try {
      if (typeof range === "string") {
        return (
          await this.dbPool.query(`
        SELECT user_id, SUM(count)::INTEGER AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date = ${formattedDate[range]}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
        ).rows as IDbChatUserStats[];
      } else {
        return (
          await this.dbPool.query(`
        SELECT user_id, SUM(count)::INTEGER AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date BETWEEN '${range[0]}' AND '${range[1]}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
        ).rows as IDbChatUserStats[];
      }
    } catch (error) {
      console.error(error);
      return [] as IDbChatUserStats[];
    }
  }

  async date(chat_id: number, date: string) {
    try {
      return (
        await this.dbPool.query(`
        SELECT user_id, SUM(count)::INTEGER AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date = '${date}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
      ).rows as IDbChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDbChatUserStats[];
    }
  }

  async all(chat_id: number): Promise<IDbChatUserStats[]> {
    const query = `
    SELECT user_id, SUM(count)::INTEGER AS count
    FROM stats_daily
    WHERE chat_id = ${chat_id}
    GROUP BY user_id
    ORDER BY count DESC;`;
    try {
      return (await this.dbPool.query(query)).rows as IDbChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDbChatUserStats[];
    }
  }
}

class DbBotStats {
  private dbPool: Pool;

  constructor(dbPool: Pool) {
    this.dbPool = dbPool;
  }
}

const dbStats = new DbStatsWrapper(DBPoolManager.getPoolRead, DBPoolManager.getPoolWrite);
export default dbStats;
// export default DbStats;
