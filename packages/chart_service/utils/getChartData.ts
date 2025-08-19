import type { IChartStatsTask } from "@sunflower-stats/shared";
import { DBPoolManager } from "../db/db.js";

const queries = Object.freeze({
    stats: {
        global: {
            topChats: {
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

async function getUserDataGlobal(task: IChartStatsTask) {
    await DBPoolManager.ensureConnection();
    return (
        await DBPoolManager.getPool.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, sum(count) as y
                                FROM stats_daily
                                WHERE user_id = $1 AND date >= NOW() - INTERVAL '1 year'
                                GROUP BY date
                                ORDER by date`,
            [task.user_id]
        )
    ).rows as { x: string; y: number }[];
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
    userGlobal: getUserDataGlobal,
};

export { getChartData };
