import { getOldDbPool } from "../db/oldDb.js";
import cacheManager from "../cache/cache.js";
import { FieldPacket } from "mysql2";
import cfg from "../config.js";

import type { RowDataPacket } from "mysql2";

type IQueryResult = RowDataPacket & {
    isPremium: number;
};

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
    let queryResult: [IQueryResult[], FieldPacket[]] | undefined;
    if (id > 0) {
        queryResult = await pool
            .query<
                IQueryResult[]
            >(`SELECT status_premium as isPremium FROM users_son WHERE user_id = ${id}`)
            .catch((e) => {
                console.log("isPremium error:", e);
                return undefined;
            });
    } else {
        queryResult = await pool
            .query<
                IQueryResult[]
            >(`SELECT state as isPremium FROM chats_premium WHERE chat_id = ${id}`)
            .catch((e) => {
                console.log("isPremium error:", e);
                return undefined;
            });
    }

    const dbStatus = Boolean(queryResult?.[0]?.[0]?.isPremium);
    cacheManager.PremiumStatusCache.set(id, dbStatus);

    return dbStatus;
}

export { isPremium };
