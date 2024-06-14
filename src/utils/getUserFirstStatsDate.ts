import { Database } from "../db/db";

async function getUserFirstStatsDate(
  chat_id: number,
  user_id: number
): Promise<string | undefined> {
  return (
    ((
      await Database.poolManager.getPoolRead.query(`SELECT 
    TO_CHAR(MIN(date), 'YYYY-MM-DD') AS first_stats_date
FROM 
    public.stats_daily
WHERE 
    chat_id = ${chat_id} AND user_id = ${user_id};`)
    ).rows[0]?.first_stats_date as string | null) || undefined
  );
}

export { getUserFirstStatsDate };
