import { FormattedDate, IFormattedRangeDateGetters } from "../utils/date";
import { IDbChatUserStatsPeriods, IDbChatUserStats } from "../types/stats";
import { Pool } from "pg";
type IDateRanges =
  | keyof IFormattedRangeDateGetters
  | [from: string, to: string];

class DbStats {
  public chat;
  public user;
  public bot;

  constructor(dbPool: Pool, dateRange: FormattedDate) {
    this.chat = new DbChatStats(dbPool, dateRange);
    this.user = new DbUserStats(dbPool, dateRange);
    this.bot = new DbBotStats(dbPool);
  }
}

class DbUserStats {
  private dbPool: Pool;
  private dateRange: FormattedDate;

  constructor(dbPool: Pool, dateRange: FormattedDate) {
    this.dbPool = dbPool;
    this.dateRange = dateRange;
  }

  async all(
    chat_id: number,
    user_id: number
  ): Promise<IDbChatUserStatsPeriods> {
    const query = `
    SELECT
    SUM(count)::INTEGER AS total,
    SUM(CASE WHEN date BETWEEN "${this.dateRange.yearRange[0]}" AND "${this.dateRange.yearRange[1]}" THEN count ELSE 0 END)::INTEGER AS year,
    SUM(CASE WHEN date BETWEEN "${this.dateRange.monthRange[0]}" AND "${this.dateRange.monthRange[1]}" THEN count ELSE 0 END)::INTEGER AS month,
    SUM(CASE WHEN date BETWEEN "${this.dateRange.weekRange[0]}" AND "${this.dateRange.weekRange[1]}" THEN count ELSE 0 END)::INTEGER AS week
    FROM stats_day_statistics
    WHERE chat_id = ${chat_id} AND user_id = ${user_id};
    `;

    try {
      //@ts-expect-error
      return (await this.dbPool.query(query))[0][0] as IDbChatUserStatsPeriods;
    } catch (error) {
      console.error(error);
      return {} as IDbChatUserStatsPeriods;
    }
  }
}

class DbChatStats {
  private dbPool: Pool;
  private dateRange: FormattedDate;

  constructor(dbPool: Pool, dateRange: FormattedDate) {
    this.dbPool = dbPool;
    this.dateRange = dateRange;
  }

  async yesterday(chat_id: number): Promise<IDbChatUserStats[]> {
    try {
      const query = `
      SELECT user_id, SUM(count)::INTEGER  AS count
      FROM stats_day_statistics
      WHERE chat_id = ${chat_id} AND date = '${this.dateRange.yesterday}'
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
        FROM stats_day_statistics
        WHERE chat_id = ${chat_id} AND date BETWEEN '${this.dateRange[range][0]}' AND '${this.dateRange[range][1]}'
        GROUP BY user_id
        ORDER BY count DESC;
          `)
        ).rows as IDbChatUserStats[];
      } else {
        return (
          await this.dbPool.query(`
        SELECT user_id, SUM(count)::INTEGER AS count
        FROM stats_day_statistics
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

  async all(chat_id: number): Promise<IDbChatUserStats[]> {
    const query = `
    SELECT user_id, SUM(count)::INTEGER AS count
    FROM stats_day_statistics
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

export default DbStats;
