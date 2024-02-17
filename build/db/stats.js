"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DbStats {
    chat;
    user;
    bot;
    constructor(dbPool, dateRange) {
        this.chat = new DbChatStats(dbPool, dateRange);
        this.user = new DbUserStats(dbPool, dateRange);
        this.bot = new DbBotStats(dbPool);
    }
}
class DbUserStats {
    dbPool;
    dateRange;
    constructor(dbPool, dateRange) {
        this.dbPool = dbPool;
        this.dateRange = dateRange;
    }
    async all(chat_id, user_id) {
        const query = `
    SELECT
    CAST(SUM(count) AS UNSIGNED) AS total,
    CAST(SUM(CASE WHEN date BETWEEN "${this.dateRange.yearRange[0]}" AND "${this.dateRange.yearRange[1]}" THEN count ELSE 0 END)  AS UNSIGNED) AS year,
    CAST(SUM(CASE WHEN date BETWEEN "${this.dateRange.monthRange[0]}" AND "${this.dateRange.monthRange[1]}" THEN count ELSE 0 END)  AS UNSIGNED) AS month,
    CAST(SUM(CASE WHEN date BETWEEN "${this.dateRange.weekRange[0]}" AND "${this.dateRange.weekRange[1]}" THEN count ELSE 0 END)  AS UNSIGNED) AS week
    FROM stats_day_statistics
    WHERE chat_id = ${chat_id} AND user_id = ${user_id};
    `;
        try {
            return (await this.dbPool.query(query))[0][0];
        }
        catch (error) {
            console.error(error);
            return {};
        }
    }
}
class DbChatStats {
    dbPool;
    dateRange;
    constructor(dbPool, dateRange) {
        this.dbPool = dbPool;
        this.dateRange = dateRange;
    }
    async yesterday(chat_id) {
        try {
            const query = `
      SELECT user_id, SUM(count) AS count,
        MAX(name) AS name,
        MAX(username) AS username
      FROM stats_day_statistics
      WHERE chat_id = ${chat_id} AND date = "${this.dateRange.yesterday}"
      GROUP BY user_id
      ORDER BY count DESC;
        `;
            return (await this.dbPool.query(query))[0];
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    async week(chat_id) {
        const query = `
    SELECT user_id, CAST(SUM(count) AS UNSIGNED) AS count,
       MAX(name) AS name,
       MAX(username) AS username
    FROM stats_day_statistics
    WHERE chat_id = ${chat_id} AND date BETWEEN "${this.dateRange.weekRange[0]}" AND "${this.dateRange.weekRange[1]}"
    GROUP BY user_id
    ORDER BY count DESC;
      `;
        try {
            return (await this.dbPool.query(query))[0];
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    async month(chat_id) {
        const query = `
    SELECT user_id, CAST(SUM(count) AS UNSIGNED) AS count,
       MAX(name) AS name,
       MAX(username) AS username
    FROM stats_day_statistics
    WHERE chat_id = ${chat_id} AND date BETWEEN "${this.dateRange.monthRange[0]}" AND "${this.dateRange.monthRange[1]}"
    GROUP BY user_id
    ORDER BY count DESC;
      `;
        try {
            return (await this.dbPool.query(query))[0];
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    async year(chat_id) {
        const startOfYear = this.dateRange.yearRange[0];
        const endOfYear = this.dateRange.monthRange[1];
        const query = `
      SELECT user_id, CAST(SUM(count) AS UNSIGNED) AS count,
         MAX(name) AS name,
         MAX(username) AS username
      FROM stats_day_statistics
      WHERE chat_id = ${chat_id} AND date BETWEEN "${startOfYear}" AND "${endOfYear}"
      GROUP BY user_id
      ORDER BY count DESC;
    `;
        try {
            return (await this.dbPool.query(query))[0];
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    async all(chat_id) {
        const query = `
    SELECT user_id, CAST(SUM(count) AS UNSIGNED) AS count,
        MAX(name) AS name,
        MAX(username) AS username
    FROM stats_day_statistics
    WHERE chat_id = ${chat_id}
    GROUP BY user_id
    ORDER BY count DESC;`;
        try {
            return (await this.dbPool.query(query))[0];
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
}
class DbBotStats {
    dbPool;
    constructor(dbPool) {
        this.dbPool = dbPool;
    }
}
exports.default = DbStats;
