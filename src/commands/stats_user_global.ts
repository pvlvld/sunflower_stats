import { ChatTypeContext } from "grammy";
import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getStatsChartFromData } from "../chart/getStatsChart.js";

async function stats_user_global(ctx: ChatTypeContext<ICommandContext, "private">) {
    const query_top = `SELECT 
    sd.chat_id, 
    c.title,
    SUM(sd.count) AS chat_count, 
    SUM(SUM(sd.count)) OVER () AS total_count
    FROM stats_daily sd
    JOIN chats c ON sd.chat_id = c.chat_id
    WHERE sd.user_id = ${ctx.from.id}  AND c.title IS NOT NULL
    GROUP BY sd.chat_id, c.title
    ORDER BY chat_count DESC
    LIMIT 15;`;

    const query_chart = `SELECT to_char(date, 'YYYY-MM-DD') AS x, sum(count) as y
    FROM stats_daily
    WHERE user_id = ${ctx.from.id} AND date >= NOW() - INTERVAL '1 year'
    GROUP BY date
    ORDER by date;`;

    const [top_data, chart_data] = await Promise.all([
        Database.poolManager.getPool.query(query_top),
        Database.poolManager.getPool.query(query_chart),
    ]);

    let i = 0;
    let row;
    let text = "<blockquote>";
    for (row of top_data.rows) {
        text += `${++i}. ${row.title} - ${(row.chat_count as number).toLocaleString("fr-FR")} повідомлень\n`;
    }
    text += "</blockquote>";
    text += `\n\nЗагалом: ${(+row.total_count as number).toLocaleString("fr-FR")} повідомлень`;
    const chart = await getStatsChartFromData(ctx.chat.id, ctx.from.id, "user", chart_data.rows);
    if (chart === undefined) {
        ctx.reply(text).catch(console.error);
    } else {
        ctx.replyWithPhoto(chart, { caption: text }).catch(console.error);
    }
}

export { stats_user_global };
