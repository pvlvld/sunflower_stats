import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { getStatsChatRating } from "../utils/getStatsRating.js";
import type { IGroupTextContext } from "../types/context.js";
import { getStatsChart } from "../chart/getStatsChart.js";
import { IDBChatUserStatsAndTotal } from "../types/stats.js";
import { IChatSettings } from "../types/settings.js";
import { botStatsManager } from "./botStats.js";
import cacheManager from "../cache/cache.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";
//@ts-expect-error
import Big from "big-js";
import { chatStatsPagination_menu } from "../ui/menus/statsPagination.js";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";
import Escape from "../utils/escape.js";
import { active } from "../redis/active.js";

const cmdToDateRangeMap = {
    день: "today",
    сьогодні: "today",
    вчора: "yesterday",
    тиждень: "weekRange",
    місяць: "monthRange",
    рік: "yearRange",
    вся: "all",
    undefined: "today",
} as const;

export type IDateRange = (typeof cmdToDateRangeMap)[keyof typeof cmdToDateRangeMap];
export type IAllowedChartStatsRanges = Exclude<IDateRange, "today" | "yesterday" | "weekRange">;

const allowedChartStatsRanges: IAllowedChartStatsRanges[] = ["monthRange", "yearRange", "all"] as const;

// TODO: use await Promise.all() for chart + msg

async function stats_chat(ctx: IGroupTextContext): Promise<void> {
    const start = String(process.hrtime.bigint());

    const splittedCommand = (ctx.msg.text ?? ctx.msg.caption).split(" ");
    const externalChatTarget = Number(splittedCommand[2]);
    let chat_id = ctx.chat.id;
    if (externalChatTarget && cfg.ADMINS.includes(ctx.from.id)) {
        chat_id = externalChatTarget;
    }

    const rawCmdDateRange = (splittedCommand[1] ?? "сьогодні").toLowerCase() as keyof typeof cmdToDateRangeMap;
    const dateRange = cmdToDateRangeMap[rawCmdDateRange] || "today";

    const [stats, chatSettings, activeUsers] = await Promise.all([
        DBStats.chat.inRage(chat_id, dateRange),
        getCachedOrDBChatSettings(chat_id),
        active.getChatUsers(chat_id),
    ]);

    const queryTime = String(process.hrtime.bigint());
    let msgTime = "";
    let chartTime = "";
    let reply: Awaited<ReturnType<typeof sendSelfdestructMessage>> = undefined;

    if (stats.length === 0) {
        return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats, {
            caption: `👀 Схоже, що повідомлень за ${rawCmdDateRange} ще немає.`,
        }));
    }
    const isPagination = await isPaginationNeeded(chat_id, stats, chatSettings);
    if (allowedChartStatsRanges.includes(dateRange as IAllowedChartStatsRanges) && chatSettings.charts) {
        const cachedChart = cacheManager.ChartCache_Chat.get(chat_id, dateRange as IAllowedChartStatsRanges);

        if (cachedChart.status === "ok") {
            const statsMessage = await getStatsMessage(
                ctx,
                dateRange,
                rawCmdDateRange,
                stats,
                chatSettings,
                1,
                true,
                activeUsers
            );
            msgTime = String(process.hrtime.bigint());
            chartTime = msgTime;

            if (cachedChart.chartFormat === "video") {
                reply = await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: true,
                        text: statsMessage,
                        chart: cachedChart.file_id,
                        chartFormat: cachedChart.chartFormat,
                    },
                    chatSettings.selfdestructstats,
                    isPagination ? chatStatsPagination_menu : undefined
                );
            } else {
                reply = await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: true,
                        text: statsMessage,
                        chart: cachedChart.file_id,
                        chartFormat: cachedChart.chartFormat,
                    },
                    chatSettings.selfdestructstats,
                    isPagination ? chatStatsPagination_menu : undefined
                );
            }
        } else if (cachedChart.status === "unrendered") {
            const statsMessage = await getStatsMessage(
                ctx,
                dateRange,
                rawCmdDateRange,
                stats,
                chatSettings,
                1,
                true,
                activeUsers
            );
            msgTime = String(process.hrtime.bigint());

            const chart = await getStatsChart(chat_id, chat_id, "chat", dateRange as IAllowedChartStatsRanges);

            if (chart) {
                chartTime = String(process.hrtime.bigint());

                reply = await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: true,
                        text: statsMessage,
                        chart: chart.chart,
                        chartFormat: chart.chartFormat,
                    },
                    chatSettings.selfdestructstats,
                    isPagination ? chatStatsPagination_menu : undefined
                );

                if (reply) {
                    cacheManager.ChartCache_Chat.set(
                        chat_id,
                        dateRange as IAllowedChartStatsRanges,
                        reply.animation?.file_id || reply.photo[reply.photo.length - 1].file_id,
                        chart.chartFormat
                    );
                }
            }
        }
    }

    if (reply === undefined) {
        const statsMessage = await getStatsMessage(
            ctx,
            dateRange,
            rawCmdDateRange,
            stats,
            chatSettings,
            1,
            false,
            activeUsers
        );
        msgTime = String(process.hrtime.bigint());

        reply = await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text: statsMessage,
                chart: undefined,
            },
            chatSettings.selfdestructstats,
            isPagination ? chatStatsPagination_menu : undefined
        );
    }

    botStatsManager.commandUse(`стата ${rawCmdDateRange}`);
    if (
        [-1001898242958, -1002144414380].includes(ctx.chat.id) ||
        (externalChatTarget && cfg.ADMINS.includes(ctx.from.id))
    ) {
        if (!chartTime) {
            chartTime = msgTime;
        }
        ctx.reply(
            `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
                .minus(queryTime)
                .div(1000000)}ms\nChart: ${new Big(chartTime).minus(msgTime).div(1000000)}ms\nTotal: ${new Big(chartTime)
                .minus(start)
                .div(1000000)}ms`
        );
    }
}

async function getStatsMessage(
    ctx: IGroupContext,
    dateRange: IDateRange,
    rawCmdDateRange: keyof typeof cmdToDateRangeMap,
    stats: IDBChatUserStatsAndTotal[],
    settings: IChatSettings,
    page: number,
    chart: boolean,
    activeUsers: Awaited<ReturnType<typeof active.getChatUsers>>
) {
    return (
        `📊 Статистика${await getPremiumMarkSpaced(ctx.chat.id)}«${Escape.html(ctx.chat.title)}» за ${
            dateRange === "all" ? "весь час" : rawCmdDateRange
        }:\n\n` +
        (await getStatsChatRating(ctx, stats, activeUsers, settings, page, dateRange, chart ? "caption" : "text"))
    );
}

async function getStatsUsersCount(chat_id: number, stats: IDBChatUserStatsAndTotal[]) {
    let user: IDBChatUserStatsAndTotal;
    let activeData = await active.getChatUsers(chat_id);
    let counter = 0;
    for (user of stats) {
        if (activeData?.[user.user_id]) {
            counter++;
        }
    }
    return counter;
}

async function isPaginationNeeded(chat_id: number, stats: IDBChatUserStatsAndTotal[], chatSettings: IChatSettings) {
    const statsUsersCount = await getStatsUsersCount(chat_id, stats);
    return chatSettings.charts ? statsUsersCount > 25 : statsUsersCount > 50;
}

export default stats_chat;
