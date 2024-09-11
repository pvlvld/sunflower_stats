import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { getStatsRatingPlusToday } from "../utils/getStatsRating.js";
import type { IGroupTextContext } from "../types/context.js";
import { getStatsChart } from "../chart/getStatsChart.js";
import { IDBChatUserStats } from "../types/stats.js";
import { IChatSettings } from "../types/settings.js";
import { botStatsManager } from "./botStats.js";
import cacheManager from "../cache/cache.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";
//@ts-expect-error
import Big from "big-js";
import { chatStatsPagination_menu } from "../ui/menus/statsPagination.js";
import { active } from "../data/active.js";

const cmdToDateRangeMap = {
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

const allowedChartStatsRanges: IAllowedChartStatsRanges[] = [
    "monthRange",
    "yearRange",
    "all",
] as const;

// TODO: use await Promise.all() for chart + msg

async function stats_chat(ctx: IGroupTextContext): Promise<void> {
    const splittedCommand = (ctx.msg.text ?? ctx.msg.caption).split(" ");
    const externalChatTarget = Number(splittedCommand[2]);
    let chat_id = -1;
    if (externalChatTarget && cfg.ADMINS.includes(ctx.from.id)) {
        chat_id = externalChatTarget;
    } else {
        chat_id = ctx.chat.id;
    }
    const chatSettings = await getCachedOrDBChatSettings(chat_id);
    const rawCmdDateRange = (
        splittedCommand[1] ?? "сьогодні"
    ).toLowerCase() as keyof typeof cmdToDateRangeMap;
    const dateRange = cmdToDateRangeMap[rawCmdDateRange];

    const start = String(process.hrtime.bigint());
    const stats = await DBStats.chat.inRage(chat_id, dateRange);
    const queryTime = String(process.hrtime.bigint());
    let msgTime = "";
    let chartTime = "";
    let reply: Awaited<ReturnType<typeof sendSelfdestructMessage>> = undefined;

    if (stats.length === 0) {
        return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats, {
            caption: `👀 Схоже, що повідомлень за ${rawCmdDateRange} ще немає.`,
        }));
    }
    const isPagination = isPaginationNeeded(chat_id, stats, chatSettings);
    if (
        allowedChartStatsRanges.includes(dateRange as IAllowedChartStatsRanges) &&
        chatSettings.charts
    ) {
        const cachedChart = cacheManager.ChartCache_Chat.get(
            chat_id,
            dateRange as IAllowedChartStatsRanges
        );

        if (cachedChart.status === "ok") {
            const statsMessage = getStatsMessage(
                chat_id,
                dateRange,
                rawCmdDateRange,
                stats,
                chatSettings,
                1,
                true
            );
            msgTime = String(process.hrtime.bigint());
            chartTime = msgTime;

            reply = await sendSelfdestructMessage(
                ctx,
                {
                    isChart: true,
                    text: statsMessage,
                    chart: cachedChart.file_id,
                },
                chatSettings.selfdestructstats,
                isPagination ? chatStatsPagination_menu : undefined
            );
        } else if (cachedChart.status === "unrendered") {
            const statsMessage = getStatsMessage(
                chat_id,
                dateRange,
                rawCmdDateRange,
                stats,
                chatSettings,
                1,
                true
            );
            msgTime = String(process.hrtime.bigint());

            const chartImage = await getStatsChart(
                chat_id,
                chat_id,
                "chat",
                dateRange as IAllowedChartStatsRanges
            );

            if (chartImage) {
                chartTime = String(process.hrtime.bigint());

                reply = await sendSelfdestructMessage(
                    ctx,
                    {
                        isChart: true,
                        text: statsMessage,
                        chart: chartImage,
                    },
                    chatSettings.selfdestructstats,
                    isPagination ? chatStatsPagination_menu : undefined
                );

                if (reply) {
                    cacheManager.ChartCache_Chat.set(
                        chat_id,
                        dateRange as IAllowedChartStatsRanges,
                        reply.photo[reply.photo.length - 1].file_id
                    );
                }
            }
        }
    }

    if (reply === undefined) {
        const statsMessage = getStatsMessage(
            chat_id,
            dateRange,
            rawCmdDateRange,
            stats,
            chatSettings,
            1,
            false
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
    if ([-1001898242958, -1002144414380].includes(ctx.chat.id)) {
        if (!chartTime) {
            chartTime = msgTime;
        }
        ctx.reply(
            `DB: ${new Big(queryTime).minus(start).div(1000000)}ms\nGen: ${new Big(msgTime)
                .minus(queryTime)
                .div(1000000)}ms\nChart: ${new Big(chartTime)
                .minus(msgTime)
                .div(1000000)}ms\nTotal: ${new Big(chartTime).minus(start).div(1000000)}ms`
        );
    }
}

function getStatsMessage(
    chat_id: number,
    dateRange: IDateRange,
    rawCmdDateRange: keyof typeof cmdToDateRangeMap,
    stats: IDBChatUserStats[],
    settings: IChatSettings,
    page: number,
    chart: boolean
) {
    return (
        `📊 Статистика чату за ${dateRange === "all" ? "весь час" : rawCmdDateRange}:\n\n` +
        getStatsRatingPlusToday(
            stats,
            chat_id,
            settings,
            page,
            dateRange,
            chart ? "caption" : "text"
        )
    );
}

function getStatsUsersCount(chat_id: number, stats: IDBChatUserStats[]) {
    let user: IDBChatUserStats;
    let activeData = active.data[chat_id];
    let counter = 0;
    for (user of stats) {
        if (activeData?.[user.user_id]) {
            counter++;
        }
    }
    return counter;
}

function isPaginationNeeded(
    chat_id: number,
    stats: IDBChatUserStats[],
    chatSettings: IChatSettings
) {
    const statsUsersCount = getStatsUsersCount(chat_id, stats);
    return chatSettings.charts ? statsUsersCount > 25 : statsUsersCount > 50;
}

export default stats_chat;
