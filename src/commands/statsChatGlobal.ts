import { ChatTypeContext } from "grammy";
import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";

async function statsChatGlobal(ctx: ChatTypeContext<ICommandContext, "private">) {
    try {
        const [chartData, messageData] = await Promise.all([
            Database.stats.bot.topChatsMonthlyRating(),
            Database.stats.bot.topChatsWeeklyRating(),
        ]);

        const chart = await getChartTopChatsMonthly(chartData);
        const message = generateTopMessage(messageData);
        await ctx.replyWithPhoto(chart, { caption: message }).catch((e) => {});
    } catch (error) {
        ctx.reply(ctx.t("error")).catch((e) => {});
        console.error(error);
    }
}

function generateTopMessage(data: Awaited<ReturnType<typeof Database.stats.bot.topChatsWeeklyRating>>) {
    let message = `Топ чатів за тиждень:\n\n<blockquote>`;

    for (let i = 0; i < data.length; i++) {
        message += `${i + 1}. «${data[i].title}» - ${data[i].total_messages}\n`;
    }
    message += "</blockquote>";
    return message;
}

export { statsChatGlobal };
