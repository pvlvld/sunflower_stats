import type { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getChartTopChatsMonthly } from "../chart/getStatsChart.js";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import { getLastDayOfMonth } from "../utils/getLastDayOfMonth.js";
import { SequentialQueue } from "../utils/SequentialQueue.js";
import Escape from "../utils/escape.js";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";
import cfg from "../config.js";

const statsChatGlobalQueue = new SequentialQueue();

async function statsChatGlobal(ctx: ICommandContext) {
    await statsChatGlobalQueue.enqueue(`stats_${ctx.from!.id}`, async () => {
        await _statsChatGlobal(ctx);
    });
}

async function _statsChatGlobal(ctx: ICommandContext) {
    if (ctx.chat.type !== "private" && !cfg.ADMINS.includes(ctx.from?.id || -1)) {
        await ctx
            .reply(ctx.t("only_private_cmd", {command: "/tchats"}), {
                link_preview_options: { is_disabled: true },
                disable_notification: true,
            })
            .catch(console.error);
        return;
    }

    ctx.api.sendChatAction(ctx.from!.id, "typing").catch((e) => {});

    try {
        const [chart, caption] = await Promise.all([getChartImage(), getChartText(ctx)]);
        const msg = await ctx.replyWithPhoto(chart, { caption });

        if (typeof chart !== "string" && msg?.photo !== undefined) {
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
        await ctx.reply(ctx.t("error")).catch(console.error);
    }
}

async function generateTopMessage(
    ctx: ICommandContext,
    data: Awaited<ReturnType<typeof Database.stats.bot.topChatsWeeklyRating>>
) {
    let chat = data[0];
    const top: string[] = [];
    for (let i = 0; i < data.length; i++) {
        chat = data[i];
        top.push(
            `${i === 0 ? "" : "\n"}${1 + i}.${await getPremiumMarkSpaced(chat.chat_id)}«${Escape.html(
                chat.title
            )}» - ${chat.total_messages.toLocaleString("fr-FR")}`
        );
    }

    return ctx.t("stats-global-chats-weekly", {
        top: top.join(""),
    });
}

async function getChartImage(): Promise<InputFile | string> {
    const cached = cacheManager.ChartCache_Global.get("statsChatGlobalMonthly");

    if (cached !== undefined) return cached;
    return await getChartTopChatsMonthly(await Database.stats.bot.topChatsMonthlyRating());
}

async function getChartText(ctx: ICommandContext): Promise<string> {
    const cached = cacheManager.TextCache.get("statsChatGlobalWeekly");

    if (cached !== undefined) return cached;
    return await generateTopMessage(ctx, await Database.stats.bot.topChatsWeeklyRating());
}

export { statsChatGlobal };
