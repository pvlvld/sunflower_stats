import { Database } from "../db/db.js";
import { IGroupHearsCommandContext } from "../types/context.js";

async function peakDays(ctx: IGroupHearsCommandContext) {
    const data = (
        await Database.poolManager.getPool.query({
            text: `SELECT sum(count) as count, TO_CHAR(date, 'YYYY-MM-DD') FROM stats_daily WHERE chat_id = ${ctx.chat.id} GROUP BY date ORDER BY count DESC LIMIT 25;`,
            rowMode: "array",
        })
    ).rows;

    if (!data || data.length === 0) {
        return void (await ctx.reply(ctx.t("error")));
    }

    const peakDays = data
        .map((row) => {
            return `${row[1]}: ${(<number>row[0]).toLocaleString("fr-FR")}`;
        })
        .join("\n");

    ctx.reply(`${ctx.t("chat-peak-days")}\n\n<code>${peakDays}</code>`).catch((e) => {});
}

export { peakDays };
