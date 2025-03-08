import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import { getLastDayOfMonth } from "../utils/getLastDayOfMonth.js";
import bot from "../bot.js";
import { SequentialQueue } from "../utils/SequentialQueue.js";
import Escape from "../utils/escape.js";

const statsChatGlobalQueue = new SequentialQueue();

async function statsChatGlobal(ctx: ICommandContext) {
    await statsChatGlobalQueue.enqueue(`stats_${ctx.from!.id}`, async () => {
        await _statsChatGlobal(ctx);
    });
}

async function _statsChatGlobal(ctx: ICommandContext) {
    if (ctx.chat.type === "private") {
        bot.api.sendChatAction(ctx.from!.id, "typing").catch((e) => {});

        const [chart, caption] = await Promise.all([getChartImage(), getChartText()]);
        try {
            const msg = await ctx.replyWithPhoto(chart, { caption: caption }).catch(console.error);
            if (typeof chart !== "string" && msg && msg.photo) {
                cacheManager.ChartCache_Global.set(
                    "statsChatGlobalMonthly",
                    msg.photo[msg.photo.length - 1].file_id,
                    getLastDayOfMonth()
                );
            }

            if (!cacheManager.TextCache.has("statsChatGlobalWeekly")) {
                cacheManager.TextCache.set("statsChatGlobalWeekly", caption);
            }
        } catch (error) {
            console.error(error);
            await ctx.reply(ctx.t("error")).catch((e) => {});
        }
    } else {
        await ctx
            .reply(ctx.t("only_private_cmd"), {
                link_preview_options: { is_disabled: true },
                disable_notification: true,
            })
            .catch((e) => {});
    }
}

function generateTopMessage(data: Awaited<ReturnType<typeof Database.stats.bot.topChatsWeeklyRating>>) {
    let message = "Топ чатів за останні сім днів:\n\n<blockquote>";

    let isDonate = false;
    let chat: (typeof data)[0];

    for (let i = 0; i < data.length; i++) {
        chat = data[i];
        isDonate = cacheManager.PremiumStatusCache.get(chat.chat_id).status;
        message += `${1 + i}.${isDonate ? " 👑 " : " "}«${Escape.html(
            chat.title
        )}» - ${chat.total_messages.toLocaleString("fr-FR")}\n`;
    }

    message += "</blockquote>";

    return message;
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
