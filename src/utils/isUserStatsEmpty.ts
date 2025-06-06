import type { IDBChatUserStatsPeriods } from "../types/stats.js";

function isUserStatsEmpty(stats: IDBChatUserStatsPeriods): boolean {
    return stats.total === 0 && stats.year === 0 && stats.month === 0 && stats.week === 0 && stats.today === 0;
}

export { isUserStatsEmpty };
