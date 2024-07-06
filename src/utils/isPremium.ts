import { getOldDbPool } from "../db/oldDb.js";
import cacheManager from "../cache/cache.js";
import { FieldPacket } from "mysql2";
import cfg from "../config.js";

type IQueryResult =
  | []
  | {
      isPremium: 1;
    }[];

//TODO: cache, local db
async function isPremium(id: number) {
  if (cfg.ADMINS.includes(id)) {
    return true;
  }

  let cachedStatus = cacheManager.PremiumStatusCache.get(id);
  if (cachedStatus.cached) {
    return cachedStatus.status;
  }

  const pool = await getOldDbPool();
  let queryResult: [IQueryResult, FieldPacket[]];
  if (id > 0) {
    //@ts-expect-error
    queryResult = await pool.query<IQueryResult>(
      `SELECT status_premium as isPremium FROM users_son WHERE user_id = ${id}`
    );
  } else {
    // @ts-expect-error
    queryResult = await pool.query<IQueryResult>(
      `SELECT state as isPremium FROM chats_premium WHERE chat_id = ${id}`
    );
  }

  const dbStatus = Boolean(queryResult[0]?.[0]?.isPremium ?? false);
  cacheManager.PremiumStatusCache.set(id, dbStatus);

  return dbStatus;
}

export { isPremium };
