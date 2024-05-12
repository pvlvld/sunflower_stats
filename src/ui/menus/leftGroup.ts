import type { IGroupContext } from "../../types/context";
import type { Filter } from "grammy";
import { active } from "../../data/active";
import { Menu } from "@grammyjs/menu";
import cfg from "../../config";
import DBPoolManager from "../../db/db";

const leftGroup_menu = new Menu<Filter<IGroupContext, ":text">>("leftGroup-menu", {
  autoAnswer: true,
}).text("Видалити дані чату", async (ctx) => {
  if (!cfg.ADMINS.includes(ctx.from.id)) {
    return;
  }

  const db = DBPoolManager.getPoolWrite;
  const chat_id = ctx.msg.text.substring(ctx.msg.text.lastIndexOf("-"));
  active.data[chat_id] = undefined;
  const res = await db.query(`
    WITH deleted_rows AS (
        DELETE FROM stats_daily
        WHERE chat_id = ${chat_id}
        RETURNING *
        )
    SELECT count(*) FROM deleted_rows;`);

  ctx.editMessageText(ctx.msg.text + `\nВидалено ${res.rows[0].count} записів.`, {
    reply_markup: undefined,
  });
});

export { leftGroup_menu };
