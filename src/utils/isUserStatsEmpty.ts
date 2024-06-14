import type { IDBChatUserStatsPeriods } from "../types/stats";

function isUserStatsEmpty(stats: IDBChatUserStatsPeriods): boolean {
  return (Object.keys(stats) as (keyof IDBChatUserStatsPeriods)[]).every((k) => !stats[k]);
}

export { isUserStatsEmpty };
