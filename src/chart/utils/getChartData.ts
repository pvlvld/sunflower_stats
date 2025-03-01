import { IAllowedChartStatsRanges } from "../../commands/stats_chat.js";
import { DBPoolManager } from "../../db/poolManager.js";
import formattedDate from "../../utils/date.js";

async function getChatData(chat_id: number, rawDateRange: IAllowedChartStatsRanges) {
    const dateRange = formattedDate[rawDateRange];
    return (
        await DBPoolManager.getPoolRead.query(`
      SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
          FROM stats_daily
          WHERE chat_id = ${chat_id} AND date BETWEEN '${dateRange[0]}' AND '${dateRange[1]}'
          GROUP BY date
          ORDER BY date;`)
    ).rows;
}

async function getUserData(chat_id: number, user_id: number) {
    return (
        await DBPoolManager.getPoolRead.query(
            `SELECT to_char(date, 'YYYY-MM-DD') AS x, count AS y
      FROM stats_daily
      WHERE user_id = ${user_id} AND chat_id = ${chat_id}
      ORDER BY date;`
        )
    ).rows;
}

const getChartData = {
    chatInChat: getChatData,
    userInChat: getUserData,
};

export { getChartData };
