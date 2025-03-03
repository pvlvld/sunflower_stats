import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";

async function statsChatGlobal(ctx: ICommandContext) {
    if (ctx.chat.type !== "private") return await ctx.reply(ctx.t("only_private_cmd")).catch((e) => {});

    try {
        const [chartData, messageData] = await Promise.all([
            Database.stats.bot.topChatsMonthlyRating(),
            Database.stats.bot.topChatsWeeklyRating(),
        ]);

        const chart = await getChartTopChatsMonthly(chartData);
        const message = generateTopMessage(messageData);
        await ctx.replyWithPhoto(chart, { caption: message }).catch((e) => {});
    } catch (error) {
        console.error(error);
        await ctx.reply(ctx.t("error")).catch((e) => {});
    }
}

function generateTopMessage(data: Awaited<ReturnType<typeof Database.stats.bot.topChatsWeeklyRating>>) {
    return (
        data.reduce((message, chat, index) => {
            return message + `${1 + index}. «${chat.title}» - ${chat.total_messages.toLocaleString("fr-FR")}\n`;
        }, "Топ чатів за останні сім днів:\n\n<blockquote>") + "</blockquote>"
    );
}

export { statsChatGlobal };
