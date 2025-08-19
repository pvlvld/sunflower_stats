import type { IAllowedChartStatsRanges } from "../commands/stats_chat.js";
import { ChartCanvasManager } from "./chartCanvas.js";
import type { Chart } from "chart.js";
import { DBPoolManager } from "../db/poolManager.js";
import chartJs from "chart.js/auto";
import { ChatTypeContext, InputFile } from "grammy";
import { Canvas, type Image, loadImage } from "canvas";
import fs from "node:fs";
import { getChartConfig, IChartConfiguration } from "./utils/getChartConfig.js";
import { getChartData } from "./utils/getChartData.js";
import { downloadAvatar } from "./utils/downloadAvatar.js";
import bot from "../bot.js";
import cfg from "../config.js";
import { overlayChartOnVideo } from "./utils/overlayChartOnVideo.js";
import { RabbitMQClient } from "@sunflower-stats/shared";
import cacheManager from "../cache/cache.js";
import { IChartCache } from "../cache/chartCache_User.js";
import {
    IBumpChartRatingResult,
    IChartResult,
    IChartStatsTask,
    IDateRange,
} from "@sunflower-stats/shared/types/types.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { DefaultChartSettings, IChartSettings } from "../db/chartSettings.js";
import { Database } from "../db/db.js";
import { IChatSettings } from "../consts/defaultChatSettings.js";
import { IGroupHearsCommandContext, IHearsCommandContext } from "../types/context.js";
import { isPremium } from "../utils/isPremium.js";
import { ConsumeMessage } from "amqplib";
import formattedDate from "../utils/date.js";
import getUserId from "../utils/getUserId.js";
import { active, IActiveUser } from "../redis/active.js";
import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import getUserStatsMessage from "../utils/getUserStatsMessage.js";
import { IDBChatUserStatsAll, IDBChatUserStatsAndTotal } from "../types/stats.js";
import { Message } from "@grammyjs/types";
import { botStatsManager } from "../commands/botStats.js";
import { DBStats } from "../db/stats.js";
import Escape from "../utils/escape.js";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";
import { getStatsChatRating } from "../utils/getStatsRating.js";
import { isValidDateOrDateRange } from "../utils/isValidDateOrDateRange.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { getLastDayOfMonth } from "../utils/getLastDayOfMonth.js";

export type IChartType = "user" | "chat";
export type IChartFormat = "video" | "image";

interface SQLQueryResult {
    month: string;
    chat_id: number;
    title: string;
    total_messages: number;
    rank: number;
}

interface BumpChartDataPoint {
    x: string;
    y: number;
    chat_id: number; // Chat pic
}

interface BumpChartSeries {
    label: string;
    chat_id: number; // Chat pic
    data: BumpChartDataPoint[];
}

/**Rerutns @InputFile success @undefined stats contain less than 7 records*/
export async function getStatsChart(
    chat_id: number,
    user_id: number,
    type: IChartType,
    rawDateRange?: IAllowedChartStatsRanges
): Promise<{ chart: InputFile; chartFormat: IChartFormat } | undefined> {
    let data: any[];
    const targetId = type === "user" ? user_id : chat_id;

    if (type === "user") {
        data = await getChartData.userInChat(chat_id, user_id);
    } else if (type === "chat") {
        if (rawDateRange) {
            data = await getChartData.chatInChat(chat_id, rawDateRange);
        } else {
            data = await getChartData.chatInChat(chat_id, "all");
        }
    } else if (type === "bot-all") {
        data = (
            await DBPoolManager.getPoolRead.query(
                `SELECT to_char(date, 'YYYY-MM-DD') AS x, SUM(count) AS y
                    FROM stats_daily
                    WHERE date > CURRENT_DATE - INTERVAL '1 year' 
                      AND date < CURRENT_DATE
                    GROUP BY date
                    ORDER BY date;`
            )
        ).rows;
    } else {
        throw new Error("Invalid chart type");
    }

    // Do we steel need this?
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig.default(chat_id, user_id, type);
    configuration.data.datasets[0].data = data;
    configuration.data.labels = data.map((v) => v["x"]);

    if (configuration.custom.transparent) {
        return {
            chart: new InputFile(
                await overlayChartOnVideo(await renderToBuffer(configuration), targetId, chat_id),
                "chart.mp4"
            ),
            chartFormat: "video",
        };
    } else {
        return {
            chart: new InputFile(await renderToBuffer(configuration), "chart.jpg"),
            chartFormat: "image",
        };
    }
}

function getTaskId(chat_id: number, target_id: number | string, date_range: IDateRange): string {
    return `chat:${chat_id}:target:${target_id}:date_range:${date_range}`;
}

class PendingCharts {
    private charts = new Map<string, { selfDestructTimer: NodeJS.Timeout }>();

    constructor() {
        const pendingChartsSet = this.charts.set.bind(this.charts);
        this.charts.set = function (key: string, value: { selfDestructTimer?: NodeJS.Timeout }) {
            const selfDestructTimer = setTimeout(() => {
                console.log(`Self-destructing pending chart: ${key}`);
                this.delete(key);
            }, 30000); // 30s
            return pendingChartsSet(key, { selfDestructTimer });
        };

        const pendingChartDelete = this.charts.delete.bind(this.charts);
        this.charts.delete = function (key: string) {
            clearTimeout(this.get(key)?.selfDestructTimer);
            return pendingChartDelete(key);
        };
    }

    public set(key: string) {
        // We don't need to pass value, it will be set by the proxy
        this.charts.set(key, undefined as any);
    }

    public get(key: string) {
        return this.charts.get(key);
    }

    public delete(key: string) {
        return this.charts.delete(key);
    }

    public has(key: string) {
        return this.charts.has(key);
    }
}

const CACHE = {
    chat: cacheManager.ChartCache_Chat,
    user: cacheManager.ChartCache_User,
    ttl: cacheManager.TTLCache,
    statsText: new Map<string, string>(),
    pendingCharts: new PendingCharts(),
};

const cmdToDateRangeMap = {
    день: "today",
    сьогодні: "today",
    вчора: "yesterday",
    тиждень: "weekRange",
    місяць: "monthRange",
    рік: "yearRange",
    вся: "all",
    undefined: "today",
    today: "today",
    yesterday: "yesterday",
    week: "weekRange",
    month: "monthRange",
    year: "yearRange",
    all: "all",
    full: "all",
    total: "all",
} as const;

export class StatsService {
    private static instance: StatsService;
    public STATS_COMMANDS = Object.freeze({
        user: ["!я", "йа", "/me", "/i", "/you", "!ти", "/u"],
        chat: ["!стата", "!статистика", "стата", "статистика", "/stats"],
        otherUser: ["!ти", "/you", "/u", "хто ти", "!хто ти"],
    });
    private cache = CACHE;
    private statsChartService: StatsChartService | null = null;
    private isInitialized = false;
    private constructor() {}

    public static getInstance(): StatsService {
        if (!StatsService.instance) {
            StatsService.instance = new StatsService();
        }
        return StatsService.instance;
    }

    public async init() {
        this.statsChartService = await StatsChartService.getInstance();
        await this.statsChartService.init();
        this.isInitialized = true;
    }

    public async userStatsGlobalCallback(ctx: ChatTypeContext<IHearsCommandContext, "private">) {
        if (!this.isInitialized || !this.statsChartService) {
            throw new Error("StatsService is not initialized");
        }

        const target_id = ctx.from.id;
        const chart_cached = cacheManager.ChartCache_User.get(ctx.chat.id, ctx.from.id);
        if (chart_cached.status !== "ok") {
            this.statsChartService.requestStatsChart(ctx, target_id, "user", "global");
        }
        let text =
            cacheManager.TextCache.get(`${ctx.from.id}_top_chats`) ||
            (await this.prepareUserTopChatsText(ctx, await Database.stats.user.topChats(target_id)));

        if (chart_cached.status === "ok") {
            if (chart_cached.chartFormat === "video") {
                await ctx.replyWithVideo(chart_cached.file_id, {
                    caption: text,
                });
            } else {
                await ctx.replyWithPhoto(chart_cached.file_id, {
                    caption: text,
                });
            }
        }
    }

    // TODO: refactor user resolving
    public async userStatsCallback(ctx: IGroupHearsCommandContext, isPersonal = true) {
        if (!this.isInitialized || !this.statsChartService) {
            throw new Error("StatsService is not initialized");
        }

        if (isPersonal) {
            botStatsManager.commandUse("i");
        } else {
            botStatsManager.commandUse("you");
        }

        const chat_id = ctx.chat.id;
        // TODO: implement correct logic
        let target_id = isPersonal && ctx.msg.reply_to_message?.from ? ctx.msg.reply_to_message.from.id : ctx.from.id;
        const original_target = target_id;
        let userStatsPromise = Database.stats.user.all(chat_id, target_id);

        // TODO: implement user settings cache
        // let userSettingsPromise = Database.user.settings.get(target_id);
        const [users, chatSettings] = await Promise.all([
            active.getChatUsers(chat_id),
            getCachedOrDBChatSettings(chat_id),
        ]);

        if (!isPersonal) {
            target_id = this.resolveTargetUser(ctx, users);
        }

        if (cfg.IGNORE_IDS.includes(target_id)) {
            return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats));
        }

        // Stupid but may considerably speed up things
        // Better to write two separate functions for self / target user stats
        if (original_target !== target_id) {
            userStatsPromise = Database.stats.user.all(chat_id, target_id);
        }

        if (!chatSettings.charts) {
            const statsText = await this.prepareUserStatsText(ctx, target_id, await userStatsPromise, users[target_id]);
            this.removeCachedStatsText(chat_id, target_id, "all");
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: statsText,
                    chart: undefined,
                },
                chatSettings.selfdestructstats
            );
            return;
        }

        const cachedChart = this.getCachedChart(chat_id, target_id, "user", "all");

        if (cachedChart.status === "ok") {
            const statsText = await this.prepareUserStatsText(ctx, target_id, await userStatsPromise, users[target_id]);
            this.removeCachedStatsText(chat_id, target_id, "all");
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: true,
                    text: statsText,
                    chart: cachedChart.file_id,
                    chartFormat: cachedChart.chartFormat,
                },
                chatSettings.selfdestructstats
            );
            return;
        }

        this.statsChartService.requestStatsChart(ctx, target_id, "user", "all");
        await this.prepareUserStatsText(ctx, target_id, await userStatsPromise, users[target_id]);
    }

    public async chatStatsCallback(ctx: IGroupHearsCommandContext) {
        if (!this.isInitialized || !this.statsChartService) {
            throw new Error("StatsService is not initialized");
        }
        botStatsManager.commandUse("stats chat");

        const chat_id = ctx.chat.id;
        const date_range = this.getChatStatsDateRange(ctx);
        const [stats, chatSettings, activeUsers] = await Promise.all([
            DBStats.chat.inRage(chat_id, date_range),
            getCachedOrDBChatSettings(chat_id),
            active.getChatUsers(chat_id),
        ]);

        if (
            !chatSettings.charts ||
            date_range[2] === "yesterday" ||
            date_range[2] === "today" ||
            date_range[2] === "custom"
        ) {
            const statsText = await this.prepareChatStatsText(ctx, chatSettings, stats, activeUsers, date_range);
            this.removeCachedStatsText(chat_id, chat_id, date_range[2]);
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: statsText,
                    chart: undefined,
                },
                chatSettings.selfdestructstats
            );
            return;
        }

        const cachedChart = this.getCachedChart(chat_id, chat_id, "chat", date_range[2]);

        if (cachedChart.status === "ok") {
            const statsText = await this.prepareChatStatsText(ctx, chatSettings, stats, activeUsers, date_range);
            this.removeCachedStatsText(chat_id, chat_id, date_range[2]);
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: true,
                    text: statsText,
                    chart: cachedChart.file_id,
                    chartFormat: cachedChart.chartFormat,
                },
                chatSettings.selfdestructstats
            );
            return;
        }

        this.statsChartService.requestStatsChart(ctx, chat_id, "chat", date_range[2]);
        await this.prepareChatStatsText(ctx, chatSettings, stats, activeUsers, date_range);
    }

    public async chatsRatingCallback(ctx: IHearsCommandContext) {
        if (!this.isInitialized || !this.statsChartService) {
            throw new Error("StatsService is not initialized");
        }
        botStatsManager.commandUse("chats rating");

        if (ctx.chat.type !== "private" && !cfg.ADMINS.includes(ctx.from?.id || -1)) {
            await ctx
                .reply(ctx.t("only_private_cmd", { command: "/tchats" }), {
                    link_preview_options: { is_disabled: true },
                    disable_notification: true,
                })
                .catch(console.error);
            return;
        }

        ctx.api.sendChatAction(ctx.from!.id, "typing").catch((e) => {});

        const cachedChart = cacheManager.ChartCache_Global.get("chats_rating:monthly");

        if (cachedChart) {
            await ctx.replyWithPhoto(cachedChart, {
                caption: await this.prepareChatsRatingText(),
            });
            return;
        }

        this.statsChartService.requestBumpChartRating(ctx);
        await this.prepareChatsRatingText();
    }

    private async prepareUserStatsText(
        ctx: IGroupHearsCommandContext,
        user_id: number,
        stats: IDBChatUserStatsAll,
        active: IActiveUser
    ): Promise<string> {
        const text = await getUserStatsMessage(ctx, user_id, stats, active);
        this.cache.statsText.set(getTaskId(ctx.chat.id, user_id, "all"), text);
        return text;
    }

    private async prepareUserTopChatsText(
        ctx: IGroupHearsCommandContext | ChatTypeContext<IHearsCommandContext, "private">,
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
        const text = ctx.t("stats-user-top-chats", {
            name: `${await getPremiumMarkSpaced(ctx.from.id)}${getUserNameLink.html(
                ctx.from.first_name,
                ctx.from.username,
                ctx.from.id
            )}`,
            top: top.join(""),
            totalMessages: (+data[0]?.total_count || 0).toLocaleString("fr-FR"),
        });

        this.cache.statsText.set(getTaskId(ctx.chat.id, ctx.from.id, "global"), text);
        return text;
    }

    private async prepareChatStatsText(
        ctx: IGroupHearsCommandContext,
        chatSettings: IChatSettings,
        stats: IDBChatUserStatsAndTotal[],
        activeUsers: Record<string, IActiveUser>,
        date_range: [string, string, IDateRange]
    ) {
        const text = await this.getChatStatsMessage(ctx, chatSettings, stats, activeUsers, date_range);
        this.cache.statsText.set(getTaskId(ctx.chat.id, ctx.chat.id, date_range[2]), text);
        return text;
    }

    private async prepareChatsRatingText() {
        const data = await Database.stats.bot.topChatsWeeklyRating();
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
        const text = top.join("");
        this.cache.statsText.set("chats_rating:weekly", text);
        return text;
    }

    private async getChatStatsMessage(
        ctx: IGroupHearsCommandContext,
        chatSettings: IChatSettings,
        stats: IDBChatUserStatsAndTotal[],
        activeUsers: Record<string, IActiveUser>,
        date_range: [string, string, IDateRange]
    ) {
        if (stats.length === 0) {
            return ctx.t("stats-empty-date");
        }

        // Custom date
        if (date_range[2] === "custom") {
            // Single date
            if (date_range[0] === date_range[1]) {
                if (!isValidDateOrDateRange([date_range[0]])) {
                    return ctx.t("stats-date-help");
                }

                return ctx.t("stats-chat-period", {
                    title: `${await getPremiumMarkSpaced(ctx.chat.id)}«${Escape.html(ctx.chat.title)}»`,
                    period: `${date_range[0]}\n\n${await getStatsChatRating(
                        ctx,
                        stats,
                        activeUsers,
                        chatSettings,
                        1,
                        "date",
                        "text"
                    )}`,
                });
            } else {
                if (!isValidDateOrDateRange([date_range[0], date_range[1]])) {
                    return ctx.t("stats-date-help");
                }

                return ctx.t("stats-chat-period", {
                    title: `${await getPremiumMarkSpaced(ctx.chat.id)}«${Escape.html(ctx.chat.title)}»`,
                    period: `${date_range[0]} - ${date_range[1]}\n\n${await getStatsChatRating(
                        ctx,
                        stats,
                        activeUsers,
                        chatSettings,
                        1,
                        "date",
                        "text"
                    )}`,
                });
            }
            // Predefined date range
        } else {
            return `${ctx.t("stats-chat-period", {
                title: `${await getPremiumMarkSpaced(ctx.chat.id)}«${Escape.html(ctx.chat.title)}»`,
                period: ctx.t(`stats-period-${date_range[2]}`),
            })}\n\n${await getStatsChatRating(
                ctx,
                stats,
                activeUsers,
                chatSettings,
                1,
                date_range[2],
                // chart ? "caption" : "text"
                "caption"
            )}`;
        }
    }

    private isPaginationNeeded(
        stats: IDBChatUserStatsAndTotal[],
        chatSettings: IChatSettings,
        users: Record<string, IActiveUser>
    ) {
        const statsUsersCount = this.getStatsUsersCount(stats, users);
        return chatSettings.charts ? statsUsersCount > 25 : statsUsersCount > 50;
    }

    private getStatsUsersCount(stats: IDBChatUserStatsAndTotal[], users: Record<string, IActiveUser>): number {
        let user: IDBChatUserStatsAndTotal;
        let counter = 0;
        for (user of stats) {
            if (users?.[user.user_id]) {
                counter++;
            }
        }
        return counter;
    }

    private getChatStatsDateRange(ctx: IGroupHearsCommandContext): [string, string, IDateRange] {
        const splittedCommand = (ctx.msg.text ?? ctx.msg.caption).split(" ");

        if (splittedCommand.length < 2) {
            return formattedDate["today"];
        }

        if (!isNaN(parseInt(splittedCommand[1]))) {
            // First character of the possible second date argument
            if (!isNaN(parseInt(splittedCommand[2]?.[0]))) {
                return [splittedCommand[1], splittedCommand[2], "custom"];
            } else {
                const date = splittedCommand[1];
                return [date, date, "custom"];
            }
        }

        const rawCmdDateRange = (splittedCommand[1] ?? "today").toLowerCase() as keyof typeof cmdToDateRangeMap;

        return formattedDate[cmdToDateRangeMap[rawCmdDateRange]];
    }

    private removeCachedStatsText(chat_id: number, user_id: number, date_range: IDateRange) {
        this.cache.statsText.delete(getTaskId(chat_id, user_id, date_range));
    }

    private getCachedChart(
        chat_id: number,
        user_id: number,
        type: IChartType,
        rawDateRange: IAllowedChartStatsRanges = "all"
    ): IChartCache {
        return type === "chat" ? this.cache.chat.get(chat_id, rawDateRange) : this.cache.user.get(chat_id, user_id);
    }

    private resolveTargetUser(
        ctx: IGroupHearsCommandContext,
        users: Awaited<ReturnType<(typeof active)["getChatUsers"]>>
    ): number {
        if (ctx.msg.reply_to_message?.from?.is_bot) {
            ctx.reply(ctx.t("robot-sounds")).catch((e) => {});
            return 0;
        }

        if (ctx.msg.reply_to_message?.from) {
            return ctx.msg.reply_to_message?.from?.id;
        }

        let userHint = (ctx.msg.text ?? ctx.msg.caption).split(" ")[-1];
        if (userHint.startsWith("@")) {
            userHint = userHint.slice(1);
            for (const user in users) {
                if (users?.[user]?.username === userHint) {
                    return +user;
                }
            }
            return -1;
        }

        if (isNaN(Number(userHint))) {
            for (const user in users) {
                if (users?.[user]?.name === userHint) {
                    return +user;
                }
            }
            return -1;
        }

        if (users?.[userHint]) {
            return +userHint;
        }

        return -1;
    }
}

export class StatsChartService {
    private static instance: StatsChartService;
    private isInitialized = false;

    private constructor(
        private rabbitMQClient: RabbitMQClient = RabbitMQClient.getInstance(cfg.RABBITMQ_USER, cfg.RABBITMQ_PASSWORD),
        private cache = CACHE
    ) {}

    public async init() {
        // Linear statistics charts
        await this.rabbitMQClient.assertQueue("chart_stats_results", {
            durable: true,
            autoDelete: false,
        });
        try {
            await this.rabbitMQClient.assertQueue("chart_stats_tasks", {
                durable: true,
                autoDelete: false,
                arguments: {
                    "x-max-priority": 1,
                },
            });
        } catch (error) {
            console.error("Error initializing chart stats tasks queue:", error);
            await this.rabbitMQClient.assertQueue("chart_stats_tasks", {
                durable: true,
                autoDelete: false,
            });
            console.log("Reinitialized chart stats tasks queue without priority");
        } finally {
            console.log("Chart stats tasks queue initialized");
        }

        // Bump rating charts
        await this.rabbitMQClient.assertQueue("bump_chart_rating_tasks", {
            durable: true,
            autoDelete: false,
        });
        await this.rabbitMQClient.assertQueue("bump_chart_rating_results", {
            durable: true,
            autoDelete: false,
        });

        this.initChartConsumers();
        this.isInitialized = true;
    }

    public static async getInstance(): Promise<StatsChartService> {
        if (!StatsChartService.instance) {
            StatsChartService.instance = new StatsChartService();
        }
        return StatsChartService.instance;
    }

    private initChartConsumers() {
        this.rabbitMQClient.consume<"chart_stats_results">("chart_stats_results", this.chartConsumer.bind(this));
        this.rabbitMQClient.consume<"bump_chart_rating_results">(
            "bump_chart_rating_results",
            this.bumpChartRatingConsumer.bind(this)
        );

        console.log("Chart consumers initialized");
    }

    public async requestStatsChart(
        ctx: IGroupHearsCommandContext | ChatTypeContext<IHearsCommandContext, "private">,
        target_id: number,
        type: IChartType,
        rawDateRange: IAllowedChartStatsRanges = "all"
    ) {
        if (!this.isInitialized) {
            throw new Error("StatsChartService is not initialized");
        }

        const user_id = ctx.from.id;
        const chat_id = ctx.chat.id;
        const task_id = getTaskId(chat_id, target_id, rawDateRange);

        if (this.cache.pendingCharts.has(task_id)) {
            console.log(`Chart is already pending: ${task_id}`);
            return;
        } else {
            this.cache.pendingCharts.set(task_id);
        }

        try {
            const [chartSettings, chat_premium, user_premium] = await Promise.all([
                this.getChartSettings(chat_id, user_id, type),
                isPremium(chat_id),
                isPremium(user_id),
            ]);
            const date = formattedDate[rawDateRange];

            this.rabbitMQClient.produce<"chart_stats_tasks">(
                "chart_stats_tasks",
                {
                    task_id,
                    chat_id,
                    user_id,
                    target_id,
                    font_color: chartSettings.font_color,
                    line_color: chartSettings.line_color,
                    usechatbgforall: chartSettings.usechatbgforall,
                    reply_to_message_id: ctx.msg.message_id,
                    thread_id: ctx.msg.message_thread_id || 0,
                    date_range: [date[0], date[1], rawDateRange],
                    chat_premium,
                    user_premium,
                },
                {
                    priority: +(chat_premium || user_premium),
                }
            );
        } catch (error) {
            console.error("Error requesting stats chart:", error);
            this.cache.pendingCharts.delete(task_id);
        }

        return undefined;
    }

    public requestBumpChartRating(ctx: IHearsCommandContext) {
        if (!this.isInitialized) {
            throw new Error("StatsChartService is not initialized");
        }
        const task_id = "chats_rating:monthly";
        if (this.cache.pendingCharts.has(task_id)) {
            console.log(`Chart is already pending: ${task_id}`);
            return;
        } else {
            this.cache.pendingCharts.set(task_id);
        }

        this.rabbitMQClient.produce<"bump_chart_rating_tasks">(
            "bump_chart_rating_tasks",
            {
                chat_id: ctx.chat.id,
                user_id: ctx.chat.id,
                task_id,
                reply_to_message_id: ctx.msg.message_id,
                thread_id: ctx.msg.message_thread_id || 0,
            },
            {}
        );
    }
    private async getChartSettings(
        chat_id: number,
        user_id: number,
        type: IChartType
    ): Promise<IChartSettings & Pick<IChatSettings, "usechatbgforall">> {
        // Turned out that this logic is correct, and old one was with a bug. lol
        const [chatSettings, userSettings] = await Promise.all([
            getCachedOrDBChatSettings(chat_id),
            Database.user.settings.get(user_id),
        ]);

        const settings = {
            line_color: userSettings.line_color,
            font_color: userSettings.font_color,
            usechatbgforall: chatSettings.usechatbgforall,
        };

        if (settings.usechatbgforall || type === "chat") {
            settings.line_color = chatSettings.line_color;
            settings.font_color = chatSettings.font_color;
        }

        return settings;
    }

    private async chartConsumer(task: IChartResult, msg: ConsumeMessage | null) {
        let text = this.cache.statsText.get(task.task_id);
        // TODO: fix possible race condition
        text ??= "oopsie";

        let statsMsg: Message.PhotoMessage | Message.AnimationMessage | undefined;
        if (!task.raw) {
            void (await bot.api.sendMessage(task.chat_id, text));
        } else if (task.format === "image") {
            statsMsg = await bot.api.sendPhoto(task.chat_id, new InputFile(Buffer.from(task.raw)), { caption: text });
        } else if (task.format === "video") {
            statsMsg = await bot.api.sendAnimation(task.chat_id, new InputFile(Buffer.from(task.raw)), {
                caption: text,
            });
        }

        if (statsMsg) {
            // TODO: fix type
            this.cacheChart(statsMsg, task as any);
        }

        this.removeCachedStatsText(task.task_id);
        this.cache.pendingCharts.delete(task.task_id);
    }

    private async bumpChartRatingConsumer(task: IBumpChartRatingResult, msg: ConsumeMessage | null) {
        if (!task.raw) {
            console.error("Bump chart rating task has no raw data");
            return;
        }

        let text = this.cache.statsText.get(task.task_id);
        // TODO: fix possible race condition
        text ??= "oopsie";

        bot.api
            .sendPhoto(task.chat_id, new InputFile(Buffer.from(task.raw)), { caption: text })
            .then((m) => {
                cacheManager.ChartCache_Global.set(
                    task.task_id,
                    m.photo[m.photo.length - 1].file_id,
                    getLastDayOfMonth()
                );
            })
            .catch((e) => {
                console.error("Error sending bump chart rating:", e);
            });
    }

    private cacheChart(msg: Message.AnimationMessage | Message.PhotoMessage | undefined, task: IChartResult) {
        if (!msg) return;
        const file_id = "animation" in msg ? msg.animation?.file_id : msg.photo[msg.photo.length - 1].file_id;
        if (task.target_id > 0) {
            cacheManager.ChartCache_User.set(msg.chat.id, task.target_id, file_id, task.format);
        } else {
            cacheManager.ChartCache_Chat.set(msg.chat.id, task.date_range[2], file_id, task.format);
        }
    }

    private removeCachedStatsText(taskId: string) {
        this.cache.statsText.delete(taskId);
    }

    public commandResolver(command: string) {}
}

async function getChatImage(chat_id: number): Promise<Image> {
    // If bot is not the main bot, return default image
    if (bot.botInfo.id != cfg.MAIN_BOT_ID) {
        return await loadImage(`./data/profileImages/!default.jpg`);
    }
    // Load image from disk
    if (fs.existsSync(`./data/profileImages/${chat_id}.jpg`)) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    }
    // dont parallelized to avoid angering the telegram api
    const isDownloaded = await downloadAvatar.chat(chat_id);
    if (isDownloaded) {
        return await loadImage(`./data/profileImages/${chat_id}.jpg`);
    } else {
        return await loadImage(`./data/profileImages/!default.jpg`);
    }
}

async function preloadChatImages(chatIds: number[]) {
    const imageMap = new Map<number, Image>();

    for (const chatId of chatIds) {
        try {
            const image = await getChatImage(chatId);
            imageMap.set(chatId, image);
        } catch (error) {
            console.error(`Failed to load image for chat_id: ${chatId}`, error);
        }
    }

    return imageMap;
}

function createProfileImagesPlugin(imageMap: Map<number, Image>) {
    return {
        id: "profileImages",
        afterDatasetsDraw(chart: any, args: any, options: any) {
            const { ctx } = chart;
            const imageSize = 72;

            let x = 0.0;
            let y = 0.0;

            for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
                const dataset = chart.data.datasets[datasetIndex];
                const chat_id = dataset.chat_id;
                const meta = chart.getDatasetMeta(datasetIndex);

                if (!imageMap.has(chat_id)) continue;

                const chatImage = imageMap.get(chat_id);

                for (let idx in meta.data) {
                    // don't draw images for data points with y > 10
                    if (dataset.data[idx].y === undefined || dataset.data[idx].y > 10) continue;
                    ({ x, y } = meta.data[idx].getCenterPoint());
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, imageSize / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(chatImage, x - imageSize / 2, y - imageSize / 2, imageSize, imageSize);
                    ctx.restore();
                }
            }
        },
    };
}

function prepareBumpChartData(sqlResults: SQLQueryResult[]): BumpChartSeries[] {
    // Group data by chat_id/title
    const chatGroups = new Map<
        number,
        {
            title: string;
            dataPoints: Map<string, number>;
        }
    >();

    // Get all unique months
    const months = new Set<string>();

    sqlResults.forEach((row) => {
        const date = new Date(row.month);
        // TODO: localizations
        const monthStr = date.toLocaleDateString("uk-UA", {
            year: "numeric",
            month: "short",
        });
        months.add(monthStr);

        if (!chatGroups.has(row.chat_id)) {
            chatGroups.set(row.chat_id, {
                title: row.title,
                dataPoints: new Map(),
            });
        }

        chatGroups.get(row.chat_id)!.dataPoints.set(monthStr, row.rank);
    });

    // Convert to array and sort chronologically
    const sortedMonths = Array.from(months).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
    });

    const series: BumpChartSeries[] = [];

    chatGroups.forEach((groupData, chat_id) => {
        months;
        const data: BumpChartDataPoint[] = sortedMonths.map((month) => ({
            x: month,
            // fetch ~15, show 10, set 16 for 11th+ place to make chart less "fake" looking
            y: groupData.dataPoints.get(month) || 16,
            chat_id: chat_id,
        }));

        series.push({
            label: groupData.title,
            chat_id: chat_id,
            data: data,
        });
    });

    return series;
}

async function getChartTopChatsMonthly(data: any) {
    const config = getChartConfig.topChatsMonthly(10);
    config.data.datasets = prepareBumpChartData(data) as any; // FIX:
    config.plugins!.push(
        createProfileImagesPlugin(
            await preloadChatImages([
                ...new Set(config.data.datasets.map((dataset: any) => dataset.chat_id)),
            ] as number[])
        )
    );
    return new InputFile(await renderToBufferX2(config), "chart.jpg");
}

async function getStatsChartFromData(
    chat_id: number,
    user_id: number,
    type: IChartType,
    data: { x: string; y: number }[]
): Promise<{ chart: InputFile; chartFormat: IChartFormat } | undefined> {
    void data.pop();
    // remove 2023-12-31 data point, it's compiled stats for whole 2023 so it breaks chart
    if (data.length !== 0 && data[0].x === "2023-12-31") {
        void data.shift();
    }

    // do not render chart if data points count less than 2
    if (data.length < 2) {
        return undefined;
    }

    const configuration = await getChartConfig.default(chat_id, user_id, type);
    configuration.data.datasets[0].data = data as any;
    configuration.data.labels = data.map((v) => v["x"]);

    if (configuration.custom.transparent) {
        return {
            chart: new InputFile(
                await overlayChartOnVideo(
                    await renderToBuffer(configuration),
                    type === "chat" ? chat_id : user_id,
                    chat_id
                ),
                "chart.mp4"
            ),
            chartFormat: "video",
        };
    } else {
        return {
            chart: new InputFile(await renderToBuffer(configuration), "chart.jpg"),
            chartFormat: "image",
        };
    }
}

function renderToBuffer(configuration: IChartConfiguration) {
    const canvas = ChartCanvasManager.get; // 0ms
    const chart = new chartJs(canvas, configuration); // 50-70ms
    let buffer;
    if (configuration.custom?.transparent) {
        buffer = chart.canvas.toBuffer("image/png", { compressionLevel: 0, filters: Canvas.PNG_NO_FILTERS }); // 15ms
    } else {
        buffer = chart.canvas.toBuffer("image/jpeg", { quality: 0.9, chromaSubsampling: true }); // 3ms
    }
    // 1ms
    destroyChart_Async(chart);
    ChartCanvasManager.recycle(canvas);
    return buffer;
}

function renderToBufferX2(configuration: IChartConfiguration) {
    const canvas = ChartCanvasManager.getX2;
    const chart = new chartJs(canvas, configuration);
    const buffer = chart.canvas.toBuffer("image/jpeg", { quality: 0.9, chromaSubsampling: true });
    destroyChart_Async(chart);
    ChartCanvasManager.recycleX2(canvas);
    return buffer;
}

async function destroyChart_Async(chart: Chart) {
    chart.destroy();
}

export { getStatsChartFromData, getChartTopChatsMonthly };
