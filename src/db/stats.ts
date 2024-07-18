import type { IDBChatUserStatsPeriods, IDBChatUserStats } from "../types/stats.js";
import formattedDate, { type IFormattedRangeDateGetters } from "../utils/date.js";
import { DBPoolManager, IDBPoolManager } from "./poolManager.js";

type IDateRanges = keyof IFormattedRangeDateGetters | [from: string, to: string];

class DBStatsWrapper {
  public chat;
  public user;
  public bot;

  constructor(DBPoolManager: IDBPoolManager) {
    this.chat = new DBChatStats(DBPoolManager);
    this.user = new DBUserStats(DBPoolManager);
    this.bot = new DBBotStats(DBPoolManager);
  }
}

class DBUserStats {
  private _dbPooolManager: IDBPoolManager;

  constructor(dbPoolManager: IDBPoolManager) {
    this._dbPooolManager = dbPoolManager;
  }

  async all(chat_id: number, user_id: number): Promise<IDBChatUserStatsPeriods> {
    const query = `
    SELECT
    SUM(count) AS total,
    SUM(CASE WHEN date BETWEEN '${formattedDate.yearRange[0]}' AND '${formattedDate.yearRange[1]}' THEN count ELSE 0 END) AS year,
    SUM(CASE WHEN date BETWEEN '${formattedDate.monthRange[0]}' AND '${formattedDate.monthRange[1]}' THEN count ELSE 0 END) AS month,
    SUM(CASE WHEN date BETWEEN '${formattedDate.weekRange[0]}' AND '${formattedDate.weekRange[1]}' THEN count ELSE 0 END) AS week,
    SUM(CASE WHEN date = '${formattedDate.today[0]}' THEN count ELSE 0 END) AS today
    FROM stats_daily
    WHERE chat_id = ${chat_id} AND user_id = ${user_id};
    `;

    try {
      return (await this._dbPooolManager.getPoolRead.query(query))
        .rows[0] as IDBChatUserStatsPeriods;
    } catch (error) {
      console.error(error);
      return {} as IDBChatUserStatsPeriods;
    }
  }

  async countUserMessage(chat_id: number, user_id: number, count?: number, date?: string) {
    let query = "SELECT update_stats_daily($1, $2";
    const values: (number | string)[] = [chat_id, user_id];

    if (count !== undefined) {
      query += ", $3";
      values.push(count);
    }

    if (date) {
      query += ", $4";
      values.push(date);
    }

    query += ")";
    try {
      await this._dbPooolManager.getPoolWrite.query(query, values);
    } catch (error) {
      console.error("Error executing query:", query, "\n", error);
    }
  }

  async firstRecordDate(chat_id: number, user_id: number) {
    const query = `SELECT min(date) FROM stats_daily WHERE chat_id = ${chat_id} AND user_id = ${user_id}`;

    try {
      return new Date((await this._dbPooolManager.getPoolRead.query(query)).rows[0] as string);
    } catch (error) {
      return undefined;
    }
  }
}

class DBChatStats {
  private _dbPoolManager: IDBPoolManager;

  constructor(dbPoolManager: IDBPoolManager) {
    this._dbPoolManager = dbPoolManager;
  }

  async today(chat_id: number): Promise<IDBChatUserStats[]> {
    try {
      const query = `
      SELECT user_id, SUM(count)  AS count
      FROM stats_daily
      WHERE chat_id = ${chat_id} AND date = '${formattedDate.today}'
      GROUP BY user_id
      ORDER BY count DESC;
        `;
      return (await this._dbPoolManager.getPoolRead.query(query)).rows as IDBChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDBChatUserStats[];
    }
  }

  async yesterday(chat_id: number): Promise<IDBChatUserStats[]> {
    try {
      const query = `
      SELECT user_id, SUM(count)  AS count
      FROM stats_daily
      WHERE chat_id = ${chat_id} AND date = '${formattedDate.yesterday[0]}'
      GROUP BY user_id
      ORDER BY count DESC;
        `;
      return (await this._dbPoolManager.getPoolRead.query(query)).rows as IDBChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDBChatUserStats[];
    }
  }

  async inRage(chat_id: number, rawRange: IDateRanges) {
    try {
      if (typeof rawRange === "string") {
        const range = formattedDate[rawRange];
        return (
          await this._dbPoolManager.getPoolRead.query(`
        SELECT user_id, SUM(count) AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date BETWEEN '${range[0]}' AND '${range[1]}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
        ).rows as IDBChatUserStats[];
      } else {
        return (
          await this._dbPoolManager.getPoolRead.query(`
        SELECT user_id, SUM(count) AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date BETWEEN '${rawRange[0]}' AND '${rawRange[1]}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
        ).rows as IDBChatUserStats[];
      }
    } catch (error) {
      console.error(error);
      return [] as IDBChatUserStats[];
    }
  }

  async date(chat_id: number, date: string) {
    try {
      return (
        await this._dbPoolManager.getPoolRead.query(`
        SELECT user_id, SUM(count) AS count
        FROM stats_daily
        WHERE chat_id = ${chat_id} AND date = '${date}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
      ).rows as IDBChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDBChatUserStats[];
    }
  }

  async all(chat_id: number): Promise<IDBChatUserStats[]> {
    const query = `
    SELECT user_id, SUM(count) AS count
    FROM stats_daily
    WHERE chat_id = ${chat_id}
    GROUP BY user_id
    ORDER BY count DESC;`;
    try {
      return (await this._dbPoolManager.getPoolRead.query(query)).rows as IDBChatUserStats[];
    } catch (error) {
      console.error(error);
      return [] as IDBChatUserStats[];
    }
  }

  async firstRecordDate(chat_id: number) {
    const query = `SELECT to_char(min(date), 'YYYY-MM-DD') as date FROM stats_daily WHERE chat_id = ${chat_id}`;

    try {
      const date = (await this._dbPoolManager.getPoolRead.query(query)).rows[0].date;
      return date ? new Date(date) : new Date();
    } catch (error) {
      return undefined;
    }
  }

  async removeCompiled2023Stats(chat_id: number) {
    const query = `DELETE FROM stats_daily WHERE chat_id = ${chat_id} AND date = '2023-12-31'`;

    try {
      void (await this._dbPoolManager.getPoolWrite.query(query));
      return true;
    } catch (error) {
      return false;
    }
  }
}

class DBBotStats {
  private _dbPoolManager: IDBPoolManager;

  constructor(dbPoolManager: IDBPoolManager) {
    this._dbPoolManager = dbPoolManager;
  }
}

const DBStats = new DBStatsWrapper(DBPoolManager);
export { DBStats, DBStatsWrapper };
