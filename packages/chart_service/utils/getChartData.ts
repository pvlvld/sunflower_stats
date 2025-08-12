import type { IChartStatsTask } from "@sunflower-stats/shared";
import { DBPoolManager } from "../db/db.js";

// TODO: Database

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

const getChartData = {
    chatInChat: getChatData,
    userInChat: getUserData,
    botTotal: getBotData,
};

export { getChartData };
