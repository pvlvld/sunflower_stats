import { ChatTypeContext } from "grammy";
import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getStatsChartFromData } from "../chart/getStatsChart.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { IDBUserTopChats } from "../types/stats.js";

async function stats_user_global(ctx: ChatTypeContext<ICommandContext, "private">) {
    const [top_data, chart_data] = await Promise.all([
        Database.stats.user.topChats(ctx.from.id),
        Database.stats.user.topChatsChart(ctx.from.id),
    ]);

    let i = 0;
    let row = <IDBUserTopChats>{};
    let text = `Особистий топ чатів ${getUserNameLink.html(
        ctx.from.first_name,
        ctx.from.username,
        ctx.from.id
    )}\n\n<blockquote>`;

    for (row of top_data) {
        text += `${++i}. ${row.title} - ${(row.chat_count as number).toLocaleString("fr-FR")} повідомлень\n`;
    }

    text += "</blockquote>";
    text += `\n\nЗагалом: ${(+row.total_count as number).toLocaleString("fr-FR")} повідомлень`;

    const chart = await getStatsChartFromData(ctx.chat.id, ctx.from.id, "user", chart_data);

    if (chart === undefined) {
        await ctx.reply(text).catch(console.error);
    } else {
        await ctx.replyWithPhoto(chart, { caption: text }).catch(console.error);
    }
}

export { stats_user_global };
