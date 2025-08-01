import { IChartTask } from "@sunflower-stats/shared/index.js";

// TODO: Database
import { DBPoolManager } from "../../db/poolManager.js";

async function getChatData(task: IChartTask) {
    return (
        await DBPoolManager.getPoolRead.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${task.chat_id} AND date BETWEEN '${task.date_from}' AND '${task.date_until}'
          GROUP BY date
          ORDER BY date;`)
    ).rows;
}

async function getUserData(task: IChartTask) {
    return (
        await DBPoolManager.getPoolRead.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, count AS y
      FROM stats_daily
      WHERE user_id = ${task.user_id} AND chat_id = ${task.chat_id}
      ORDER BY date;`
        )
    ).rows;
}

const getChartData = {
    chatInChat: getChatData,
    userInChat: getUserData,
};

export { getChartData };
