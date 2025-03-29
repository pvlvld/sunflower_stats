import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import getUserStatsMessage from "../utils/getUserStatsMessage.js";
import { isUserStatsEmpty } from "../utils/isUserStatsEmpty.js";
import type { IGroupTextContext } from "../types/context.js";
import { getStatsChart } from "../chart/getStatsChart.js";
import getUserId from "../utils/getUserId.js";
import cacheManager from "../cache/cache.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";

async function stats_user(ctx: IGroupTextContext, type: "я" | "ти" = "я") {
    const chat_id = ctx.chat.id;
    let user_id = 0;
    if (type === "я") {
        user_id = ctx.from.id;
    } else {
        if (ctx.msg.reply_to_message?.from?.is_bot) {
            return void (await ctx.reply("🤖 біп-буп"));
        }
        user_id =
            ctx.msg.reply_to_message?.from?.id ||
            getUserId((ctx.msg.text ?? ctx.msg.caption).slice(type.length + 2), chat_id) ||
            -1;
    }

    if (cfg.IGNORE_IDS.includes(user_id)) {
        return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats));
    }

    const chatSettings = await getCachedOrDBChatSettings(chat_id);
    const user_stats = await DBStats.user.all(chat_id, user_id);

    if (isUserStatsEmpty(user_stats)) {
        if (type === "я") {
            return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats),
            { caption: "Схоже, що це ваше перше повідомлення в цьому чаті 🎉" });
        } else {
            return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats), { caption: "Вперше бачу 🤔" });
        }
    }

    const statsMessage = getUserStatsMessage(chat_id, user_id, user_stats);

    if (!chatSettings.charts) {
        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text: statsMessage,
                chart: undefined,
            },
            chatSettings.selfdestructstats
        ));
    }

    const cachedChart = cacheManager.ChartCache_User.get(chat_id, user_id);

    try {
        switch (cachedChart.status) {
            case "unrendered":
                const chart = await getStatsChart(chat_id, user_id, "user");
                if (chart) {
                    let msg: Awaited<ReturnType<typeof sendSelfdestructMessage>>;
                    if (chart.chartFormat === "video") {
                        msg = await ctx.replyWithAnimation(chart.chart, { caption: statsMessage });
                    } else {
                        msg = await sendSelfdestructMessage(
                            ctx,
                            {
                                isChart: true,
                                chartFormat: chart.chartFormat,
                                text: statsMessage,
                                chart: chart.chart,
                            },
                            chatSettings.selfdestructstats
                        );
                    }

                    if (!msg) {
                        return;
                    }

                    cacheManager.ChartCache_User.set(chat_id, user_id, msg.photo[msg.photo.length - 1].file_id);
                } else {
                    cacheManager.ChartCache_User.set(chat_id, user_id, "");
                    return void (await sendSelfdestructMessage(
                        ctx,
                        {
                            isChart: false,
                            text: statsMessage,
                            chart: undefined,
                        },
                        chatSettings.selfdestructstats
                    ));
                }
                return;
            case "ok":
                return void (await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: true,
                        chartFormat: cachedChart.format,
                        text: statsMessage,
                        chart: cachedChart.file_id,
                    },
                    chatSettings.selfdestructstats
                ));

            case "skip":
                return void (await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: false,
                        text: statsMessage,
                        chart: undefined,
                    },
                    chatSettings.selfdestructstats
                ));
            default:
                throw new Error("Unknown cachedChart status!");
        }
    } catch (error: any) {
        console.error(error);
    }
}

export { stats_user };
