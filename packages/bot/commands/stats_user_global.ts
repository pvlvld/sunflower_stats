import { ChatTypeContext, InputFile } from "grammy";
import { ICommandContext } from "../types/context.js";
import { Database } from "../db/db.js";
import { getStatsChartFromData } from "../chart/getStatsChart.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import cacheManager from "../cache/cache.js";
import Escape from "../utils/escape.js";
import { Message } from "@grammyjs/types";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";

async function stats_user_global(ctx: ChatTypeContext<ICommandContext, "private">) {
    const chart_cached = cacheManager.ChartCache_User.get(ctx.me.id, ctx.from.id);
    const top_cached = cacheManager.TextCache.get(`${ctx.from.id}_top_chats`);

    let top_data: Awaited<ReturnType<typeof Database.stats.user.topChats>> = [];
    let chart_data: Awaited<ReturnType<typeof Database.stats.user.topChatsChart>> = [];
    let chart: Awaited<ReturnType<typeof getStatsChartFromData>>;

    if (top_cached == undefined || chart_cached.status !== "ok") {
        [top_data, chart_data] = await Promise.all([
            Database.stats.user.topChats(ctx.from.id),
            Database.stats.user.topChatsChart(ctx.from.id),
        ]);

        cacheManager.TextCache.set(`${ctx.from.id}_top_chats`, await generateUserGlobalTop(ctx, top_data));
        chart = await getStatsChartFromData(ctx.chat.id, ctx.from.id, "user", chart_data);
    }

    if (chart === undefined && chart_cached.status !== "ok") {
        return await ctx.reply(cacheManager.TextCache.get(`${ctx.from.id}_top_chats`)!).catch(console.error);
    }

    let msg: Message.PhotoMessage | Message.AnimationMessage | void;

    if (chart_cached.chartFormat === "video" || chart?.chartFormat === "video") {
        msg = await ctx
            .replyWithAnimation(chart?.chart || chart_cached.file_id, {
                caption: cacheManager.TextCache.get(`${ctx.from.id}_top_chats`) || "",
            })
            .catch(console.error);
    } else {
        msg = await ctx
            .replyWithPhoto(chart?.chart || chart_cached.file_id, {
                caption: cacheManager.TextCache.get(`${ctx.from.id}_top_chats`) || "",
            })
            .catch(console.error);
    }

    if (msg) {
        cacheManager.ChartCache_User.set(
            ctx.me.id,
            ctx.from.id,
            "photo" in msg ? msg.photo[msg.photo.length - 1].file_id : msg.animation.file_id,
            "photo" in msg ? "image" : "video"
        );
    }
}

async function generateUserGlobalTop(
    ctx: ChatTypeContext<ICommandContext, "private">,
    data: Awaited<ReturnType<typeof Database.stats.user.topChats>>
) {
    const top: string[] = [];
    for (let i = 0; i < data.length; i++) {
        top.push(
            `${i === 0 ? "" : "\n"}${1 + i}. «${Escape.html(data[i].title)}» - ${(
                data[i].chat_count as number
            ).toLocaleString("fr-FR")}`
        );
    }

    return ctx.t("stats-user-top-chats", {
        name: `${await getPremiumMarkSpaced(ctx.from.id)}${getUserNameLink.html(
            ctx.from.first_name,
            ctx.from.username,
            ctx.from.id
        )}`,
        top: top.join(""),
        totalMessages: (+data[0]?.total_count || 0).toLocaleString("fr-FR"),
    });
}

export { stats_user_global };
