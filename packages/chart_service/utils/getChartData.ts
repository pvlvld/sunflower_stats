import type { IChartStatsTask } from "@sunflower-stats/shared";
import { DBPoolManager } from "../db/db.js";

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
                  SELECT user_id, SUM(count) AS messages
                  FROM public.stats_daily
                  WHERE date >= current_date - INTERVAL '${daysCount} DAY' AND chat_id = $1
                  GROUP BY user_id
                )
                SELECT user_id, messages
                FROM chat_activity
                WHERE messages < $2
                ORDER BY messages DESC`,
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

async function getChatData(task: IChartStatsTask) {
    await DBPoolManager.ensureConnection();
    return (
        await DBPoolManager.getPool.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${task.chat_id} AND date BETWEEN '${task.date_range[0]}' AND '${task.date_range[1]}'
          GROUP BY date
          ORDER BY date;`)
    ).rows;
}

async function getUserData(task: IChartStatsTask) {
    await DBPoolManager.ensureConnection();
    return (
        await DBPoolManager.getPool.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, count AS y
      FROM stats_daily
      WHERE user_id = ${task.user_id} AND chat_id = ${task.chat_id}
      ORDER BY date;`
        )
    ).rows;
}

async function getBotData() {
    await DBPoolManager.ensureConnection();
    return (
        await DBPoolManager.getPool.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
                    FROM stats_daily
                    WHERE date > CURRENT_DATE - INTERVAL '1 year' 
                      AND date < CURRENT_DATE
                    GROUP BY date
                    ORDER BY date;`
        )
    ).rows;
}

async function getChatsTopMonthlyData() {
    await DBPoolManager.ensureConnection();
    return (await DBPoolManager.getPool.query(queries.stats.global.topChats.monthlyRankAndTotal)).rows as {
        month: string;
        chat_id: number;
        title: string;
        total_messages: number;
        rank: number;
    }[];
}

const getChartData = {
    chatInChat: getChatData,
    userInChat: getUserData,
    botTotal: getBotData,
    chatsTopMonthly: getChatsTopMonthlyData,
};

export { getChartData };
