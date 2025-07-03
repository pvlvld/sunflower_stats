import cacheManager from "../cache/cache.js";
import { Database } from "../db/db.js";
import { IGroupHearsCommandContext } from "../types/context.js";

async function peakDays(ctx: IGroupHearsCommandContext) {
    let peakDays = cacheManager.TextCache.get(`peakDays:${ctx.chat.id}`) || "";

    if (!peakDays) {
        console.log("cache miss");
        const data = (
            await Database.poolManager.getPool.query({
                text: `SELECT sum(count) as count, TO_CHAR(date, 'YYYY-MM-DD') FROM stats_daily WHERE chat_id = ${ctx.chat.id} GROUP BY date ORDER BY count DESC LIMIT 25;`,
                rowMode: "array",
            })
        ).rows;

        if (!data || data.length === 0) {
            return void (await ctx.reply(ctx.t("error")));
        }

        peakDays = data
            .map((row) => {
                return `${row[1]}: ${(<number>row[0]).toLocaleString("fr-FR")}`;
            })
            .join("\n");

        cacheManager.TextCache.set(`peakDays:${ctx.chat.id}`, peakDays);
    }

    await ctx.reply(`${ctx.t("chat-peak-days")}\n\n<code>${peakDays}</code>`).catch((e) => {});
}

export { peakDays };
