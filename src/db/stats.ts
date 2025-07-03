import type {
    IDBChatUserStats,
    IDBChatUserStatsAll,
    IDBChatUserStatsAndTotal,
    IDBUserTopChats,
} from "../types/stats.js";
import formattedDate, { type IFormattedRangeDateGetters } from "../utils/date.js";
import { DBPoolManager, IDBPoolManager } from "./poolManager.js";

type IDateRanges = keyof IFormattedRangeDateGetters | [from: string, to: string];

const queries = Object.freeze({
    stats: {
        user: {
            personal: `SELECT
                        SUM(count) AS total,
                        SUM(CASE WHEN date BETWEEN $1 AND $2 THEN count ELSE 0 END) AS year,
                        SUM(CASE WHEN date BETWEEN $3 AND $4 THEN count ELSE 0 END) AS month,
                        SUM(CASE WHEN date BETWEEN $5 AND $6 THEN count ELSE 0 END) AS week,
                        SUM(CASE WHEN date = $7 THEN count ELSE 0 END) AS today,
                        TO_CHAR(MIN(date), 'YYYY-MM-DD') AS first_seen
                        FROM stats_daily
                        WHERE chat_id = $8 AND user_id = $9`,
            topChats: `SELECT 
                        sd.chat_id, 
                        c.title,
                        SUM(sd.count) AS chat_count, 
                        SUM(SUM(sd.count)) OVER () AS total_count
                        FROM stats_daily sd
                        JOIN chats c ON sd.chat_id = c.chat_id
                        WHERE sd.user_id = $1  AND c.title IS NOT NULL
                        GROUP BY sd.chat_id, c.title
                        ORDER BY chat_count DESC
                        LIMIT 15`,
            topChatsChart: `SELECT to_char(date, 'YYYY-MM-DD') AS x, sum(count) as y
                                FROM stats_daily
                                WHERE user_id = $1 AND date >= NOW() - INTERVAL '1 year'
                                GROUP BY date
                                ORDER by date`,
        },
        chat: {
            customRange: `WITH user_counts AS (
                                SELECT user_id, SUM(count) AS count
                                FROM stats_daily
                                WHERE chat_id = $1
                                  AND date BETWEEN $2 AND $3
                                GROUP BY user_id
                            )
                            SELECT user_id, count, (SELECT SUM(count) FROM user_counts) AS total_count
                            FROM user_counts
                            ORDER BY count DESC;`,
            date: `WITH user_counts AS (
                                SELECT user_id, SUM(count) AS count
                                FROM stats_daily
                                WHERE chat_id = $1
                                  AND date = $2
                                GROUP BY user_id
                            )
                            SELECT user_id, count, (SELECT SUM(count) FROM user_counts) AS total_count
                            FROM user_counts
                            ORDER BY count DESC;`,
            all: `SELECT user_id, SUM(count) AS count
                    FROM stats_daily
                    WHERE chat_id = $1
                    GROUP BY user_id
                    ORDER BY count DESC`,
            /**$1 - chat_id
             *
             * $2 - target messages count
             *
             * $3 - days count
             */
            usersBelowTargetMessagesLastXDays: (daysCount: string) => `WITH chat_activity AS (
                  SELECT user_id, SUM(count) AS total_count
                  FROM public.stats_daily
                  WHERE date >= current_date - INTERVAL '${daysCount} DAY' AND chat_id = $1
                  GROUP BY user_id
                )
                SELECT user_id
                FROM chat_activity
                WHERE total_count < $2;`,
        },
        global: {
            topChats: {
                weeklyRankAndTotal: `SELECT
                                        s.chat_id,
                                        c.title,
                                        SUM(s.count) as total_messages
                                    FROM
                                        public.stats_daily s
                                    LEFT JOIN
                                        public.chats c ON s.chat_id = c.chat_id
                                    WHERE
                                        s.date >= CURRENT_DATE - INTERVAL '7 days'
                                        AND s.date < CURRENT_DATE
                                        AND c.title IS NOT NULL
                                    GROUP BY
                                        s.chat_id, c.title
                                    ORDER BY
                                        total_messages DESC
                                    LIMIT 15;`,
                // can play with r.rank <= 10 to make chart less "fake" looking
                // TODO: use stats_bot_in in future
                monthlyRankAndTotal: `WITH titled_chats AS (
                                SELECT chat_id
                                FROM chats
                                WHERE title IS NOT NULL
                            ),
                            monthly_chat_stats AS (
                                SELECT
                                    DATE_TRUNC('month', date) AS month,
                                    sd.chat_id,
                                    SUM(count) AS total_messages
                                FROM
                                    stats_daily sd
                                JOIN titled_chats tc ON sd.chat_id = tc.chat_id
                                WHERE
                                    date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
                                    AND date < DATE_TRUNC('month', CURRENT_DATE)
                                GROUP BY
                                    DATE_TRUNC('month', date),
                                    sd.chat_id
                            ),
                            ranked_chats AS (
                                SELECT
                                    month,
                                    chat_id,
                                    total_messages,
                                    DENSE_RANK() OVER (
                                        PARTITION BY month 
                                        ORDER BY total_messages DESC
                                    ) AS rank
                                FROM monthly_chat_stats
                            )
                            SELECT
                                r.month,
                                r.chat_id,
                                c.title,
                                r.total_messages,
                                r.rank
                            FROM
                                ranked_chats r
                                JOIN chats c ON r.chat_id = c.chat_id
                            WHERE
                                r.rank <= 15
                            ORDER BY
                                r.month,
                                r.rank;`,
                month: ``,
            },
        },
    },
});

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

    async all(chat_id: number, user_id: number): Promise<IDBChatUserStatsAll> {
        try {
            return (
                await this._dbPooolManager.getPoolRead.query({
                    name: "get_stats_user_chat_personal",
                    text: queries.stats.user.personal,
                    values: [
                        formattedDate.yearRange[0],
                        formattedDate.yearRange[1],
                        formattedDate.monthRange[0],
                        formattedDate.monthRange[1],
                        formattedDate.weekRange[0],
                        formattedDate.weekRange[1],
                        formattedDate.today[0],
                        chat_id,
                        user_id,
                    ],
                })
            ).rows[0] as IDBChatUserStatsAll;
        } catch (error) {
            console.error(error);
            return {} as IDBChatUserStatsAll;
        }
    }

    async topChats(user_id: number) {
        try {
            return (
                await this._dbPooolManager.getPoolRead.query({
                    name: "get_stats_user_chat_top",
                    text: queries.stats.user.topChats,
                    values: [user_id],
                })
            ).rows as IDBUserTopChats[];
        } catch (error) {
            console.error(error);
            return [] as IDBUserTopChats[];
        }
    }

    async topChatsChart(user_id: number) {
        try {
            return (
                await this._dbPooolManager.getPoolRead.query({
                    name: "get_stats_user_chat_top_chart",
                    text: queries.stats.user.topChatsChart,
                    values: [user_id],
                })
            ).rows as { x: string; y: number }[];
        } catch (error) {
            console.error(error);
            return [] as { x: string; y: number }[];
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
            return (
                await this._dbPoolManager.getPoolRead.query({
                    name: "stats_chat_today",
                    text: queries.stats.chat.date,
                    values: [chat_id, formattedDate.today],
                })
            ).rows as IDBChatUserStats[];
        } catch (error) {
            console.error(error);
            return [] as IDBChatUserStats[];
        }
    }

    async yesterday(chat_id: number): Promise<IDBChatUserStats[]> {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    name: "stats_chat_yesterday",
                    text: queries.stats.chat.date,
                    values: [chat_id, formattedDate.yesterday[0]],
                })
            ).rows as IDBChatUserStats[];
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
                    await this._dbPoolManager.getPoolRead.query({
                        name: "stats_chat_customrange",
                        text: queries.stats.chat.customRange,
                        values: [chat_id, range[0], range[1]],
                    })
                ).rows as IDBChatUserStatsAndTotal[];
            } else {
                return (
                    await this._dbPoolManager.getPoolRead.query({
                        name: "stats_chat_customrange",
                        text: queries.stats.chat.customRange,
                        values: [chat_id, rawRange[0], rawRange[1]],
                    })
                ).rows as IDBChatUserStatsAndTotal[];
            }
        } catch (error) {
            console.error(error);
            return [] as IDBChatUserStatsAndTotal[];
        }
    }

    async date(chat_id: number, date: string) {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    name: "stats_chat_date",
                    text: queries.stats.chat.date,
                    values: [chat_id, date],
                })
            ).rows as IDBChatUserStatsAndTotal[];
        } catch (error) {
            console.error(error);
            return [] as IDBChatUserStatsAndTotal[];
        }
    }

    async all(chat_id: number): Promise<IDBChatUserStats[]> {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    name: "stats_chat_all",
                    text: queries.stats.chat.all,
                    values: [chat_id],
                })
            ).rows as IDBChatUserStats[];
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

    async deleteAllChatStats(chat_id: number) {
        const query = `DELETE FROM stats_daily WHERE chat_id = ${chat_id}`;

        try {
            void (await this._dbPoolManager.getPoolWrite.query(query));
            return true;
        } catch (error) {
            return false;
        }
    }

    async usersBelowTargetMessagesLastXDays(chat_id: number, targetMessagesCount: string, targetDaysCount: string) {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    text: queries.stats.chat.usersBelowTargetMessagesLastXDays(targetDaysCount),
                    values: [chat_id, targetMessagesCount],
                })
            ).rows as { user_id: number }[];
        } catch (error) {
            console.error(error);
            return [] as { user_id: number }[];
        }
    }
}

class DBBotStats {
    private _dbPoolManager: IDBPoolManager;

    constructor(dbPoolManager: IDBPoolManager) {
        this._dbPoolManager = dbPoolManager;
    }

    public async topChatsMonthlyRating() {
        try {
            return (await this._dbPoolManager.getPoolRead.query(queries.stats.global.topChats.monthlyRankAndTotal))
                .rows as {
                month: string;
                chat_id: number;
                title: string;
                total_messages: number;
                rank: number;
            }[];
        } catch (error) {
            console.error(error);
            return [] as { month: string; chat_id: number; title: string; total_messages: number; rank: number }[];
        }
    }

    public async topChatsPastMonthRating() {
        try {
            return (await this._dbPoolManager.getPoolRead.query(queries.stats.global.topChats.month)).rows as {
                month: string;
                chat_id: number;
                title: string;
                total_messages: number;
                rank: number;
            }[];
        } catch (error) {
            console.error(error);
            return [] as { month: string; chat_id: number; title: string; total_messages: number; rank: number }[];
        }
    }

    public async topChatsWeeklyRating() {
        try {
            return (await this._dbPoolManager.getPoolRead.query(queries.stats.global.topChats.weeklyRankAndTotal))
                .rows as {
                chat_id: number;
                title: string;
                total_messages: number;
            }[];
        } catch (error) {
            console.error(error);
            return [] as { chat_id: number; title: string; total_messages: number }[];
        }
    }

    public async messagesDuringDate(date: string) {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    text: `SELECT SUM(count) AS total FROM stats_daily WHERE date = $1`,
                    values: [date],
                })
            ).rows[0].total as number;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }

    public async totalMessages() {
        try {
            return (
                await this._dbPoolManager.getPoolRead.query({
                    text: `SELECT SUM(count) AS total FROM stats_daily`,
                })
            ).rows[0].total as number;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }
}

const DBStats = new DBStatsWrapper(DBPoolManager);
export { DBStats, DBStatsWrapper };
