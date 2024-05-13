import { active } from "../data/active";
import DBPoolManager from "../db/db";
import { QueryResult } from "pg";

/** Returns -1 on db error */
async function removeChatData(chat_id: string | number): Promise<number> {
  active.data[chat_id] = undefined;
  let res: QueryResult<any>;

  try {
    res = await DBPoolManager.getPoolRead.query(
      `
              WITH deleted_rows AS (
                  DELETE FROM stats_daily
                  WHERE chat_id = ${chat_id}
                  RETURNING *
                  )
              SELECT count(*) FROM deleted_rows;`
    );
  } catch (error) {
    console.error(error);
    return -1;
  }

  return res.rows[0].count as number;
}

export { removeChatData };
