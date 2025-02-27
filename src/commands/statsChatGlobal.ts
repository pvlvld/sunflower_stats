import { ChatTypeContext } from "grammy";
import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";

async function statsChatGlobal(ctx: ChatTypeContext<ICommandContext, "private">) {
    try {
        const stats = await Database.stats.bot.topChatsMonthly();
        const chart = await getChartTopChatsMonthly(stats);
        await ctx.replyWithPhoto(chart, { caption: "test" }).catch((e) => {});
    } catch (error) {
        ctx.reply(ctx.t("error")).catch((e) => {});
        console.error(error);
    }
}

export { statsChatGlobal };
