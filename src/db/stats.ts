import mysql from "mysql2/promise";
import { FormattedDate } from "../utils/date";

class DbStats {
  public chat;
  public user;
  public bot;

  constructor(dbPool: mysql.Pool, dateRange: FormattedDate) {
    this.chat = new DbChatStats(dbPool, dateRange);
    this.user = new DbUserStats(dbPool);
    this.bot = new DbBotStats(dbPool);
  }
}

class DbUserStats {
  private dbPool: mysql.Pool;

  constructor(dbPool: mysql.Pool) {
    this.dbPool = dbPool;
  }
}

class DbChatStats {
  private dbPool: mysql.Pool;
  private dateRange: FormattedDate;

  constructor(dbPool: mysql.Pool, dateRange: FormattedDate) {
    this.dbPool = dbPool;
    this.dateRange = dateRange;
  }

  async yesterday(chat_id: number) {
    try {
      return (
        await this.dbPool.query(
          `SELECT user_id, count, name, username FROM stats_day_statistics WHERE chat_id = ${chat_id} AND date = "${this.dateRange.yesterday}" ORDER BY count DESC`
        )
      )[0] as [
        { user_id: number; count: number; name: string; username: string }
      ];
    } catch (error) {
      console.error(error);
      //@ts-ignore
      return [] as [
        { user_id: number; count: number; name: string; username: string }
      ];
    }
  }
}

class DbBotStats {
  private dbPool: mysql.Pool;

  constructor(dbPool: mysql.Pool) {
    this.dbPool = dbPool;
  }
}

export default DbStats;
