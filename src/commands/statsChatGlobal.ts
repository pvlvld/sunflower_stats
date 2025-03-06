import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import { getLastDayOfMonth } from "../utils/getLastDayOfMonth.js";

async function statsChatGlobal(ctx: ICommandContext) {
    if (ctx.chat.type !== "private") return await ctx.reply(ctx.t("only_private_cmd")).catch((e) => {});

    const chart = getChartImage();
    const caption = getChartText();

    try {
        const msg = await ctx.replyWithPhoto(await chart, { caption: await caption }).catch(console.error);

        if (typeof chart !== "string" && msg && msg.photo) {
            cacheManager.ChartCache_Global.set(
                "statsChatGlobalMonthly",
                msg.photo[msg.photo.length - 1].file_id,
                getLastDayOfMonth()
            );
        }

        if (cacheManager.TextCache.has("statsChatGlobalWeekly")) {
            //@ts-expect-error
            cacheManager.TextCache.set("statsChatGlobalWeekly", caption);
        }
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

async function getChartImage(): Promise<InputFile | string> {
    const cached = cacheManager.ChartCache_Global.get("statsChatGlobalMonthly");

    if (cached !== undefined) return cached;
    return await getChartTopChatsMonthly(await Database.stats.bot.topChatsMonthlyRating());
}

async function getChartText(): Promise<string> {
    const cached = cacheManager.TextCache.get("statsChatGlobalWeekly");

    if (cached !== undefined) return cached;
    return generateTopMessage(await Database.stats.bot.topChatsWeeklyRating());
}

export { statsChatGlobal };
