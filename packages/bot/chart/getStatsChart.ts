import type { IAllowedChartStatsRanges } from "../commands/stats_chat.js";
import { ChatTypeContext, InputFile } from "grammy";
import bot, { i18n } from "../bot.js";
import cfg from "../config.js";
import { RabbitMQClient } from "@sunflower-stats/shared";
import cacheManager from "../cache/cache.js";
import { IChartCache } from "../cache/chartCache_User.js";
import {
    IBumpChartRatingResult,
    IChartResult,
    IChartStatsTask,
    IDateRange,
} from "@sunflower-stats/shared/types/types.js";
import { IChartSettings } from "../db/chartSettings.js";
import { Database } from "../db/db.js";
import { IChatSettings } from "../consts/defaultChatSettings.js";
import { IGroupHearsCommandContext, IHearsCommandContext } from "../types/context.js";
import { isPremium } from "../utils/isPremium.js";
import { ConsumeMessage } from "amqplib";
import formattedDate from "../utils/date.js";
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
import { LocaleService } from "../cache/localeService.js";
import { SettingsService } from "../utils/settingsService.js";

export type IChartType = "user" | "chat";

function getTaskId(chat_id: number, target_id: number | string, date_range: IDateRange): string {
    return `chat:${chat_id}:target:${target_id}:date_range:${date_range}`;
}

async function getChartSettings(
    chat_id: number,
    user_id: number,
    type: IChartType,
): Promise<IChartSettings & Pick<IChatSettings, "usechatbgforall">> {
    // Turned out that this logic is correct, and old one was with a bug. lol
    // TODO: Check non premium user / chat behavior
    const [chatSettings, userSettings] = await Promise.all([
        SettingsService.getInstance().getChatSettings(chat_id),
        SettingsService.getInstance().getUserSettings(user_id),
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

export class StatsTextService {
    private static instance: StatsTextService;
    private cache = CACHE;
    private getChartSettings = getChartSettings;
    private constructor() {}

    public static getInstance() {
        if (!StatsTextService.instance) {
            StatsTextService.instance = new StatsTextService();
        }
        return StatsTextService.instance;
    }

    public async prepareUserTopChatsText(
        ctx: IGroupHearsCommandContext | ChatTypeContext<IHearsCommandContext, "private">,
        data: Awaited<ReturnType<typeof Database.stats.user.topChats>>,
    ) {
        const top: string[] = [];
        for (let i = 0; i < data.length; i++) {
            top.push(
                `${i === 0 ? "" : "\n"}${1 + i}. «${Escape.html(data[i].title)}» - ${(
                    data[i].chat_count as number
                ).toLocaleString("fr-FR")}`,
            );
        }
        const text = ctx.t("stats-user-top-chats", {
            name: `${await getPremiumMarkSpaced(ctx.from.id)}${getUserNameLink.html(
                ctx.from.first_name,
                ctx.from.username,
                ctx.from.id,
            )}`,
            top: top.join(""),
            totalMessages: (+data[0]?.total_count || 0).toLocaleString("fr-FR"),
        });

        this.cache.statsText.set(getTaskId(ctx.chat.id, ctx.from.id, "global"), text);
        return text;
    }

    public async prepareChatStatsText(
        chat_id: number,
        chat_title: string,
        chatSettings: IChatSettings,
        stats: IDBChatUserStatsAndTotal[],
        activeUsers: Record<string, IActiveUser>,
        date_range: [string, string, IDateRange],
    ) {
        const text = await this.getChatStatsMessage(
            chat_id,
            chat_title,
            chatSettings,
            stats,
            activeUsers,
            date_range,
        );
        this.cache.statsText.set(getTaskId(chat_id, chat_id, date_range[2]), text);
        return text;
    }

    // public async genChatStatsTextFromTask(task: IChartStatsTask) {
    //     const [stats, settings, activeUsers] = await Promise.all([
    //         DBStats.chat.inRage(task.chat_id, task.date_range),
    //         this.getChartSettings(task.chat_id, task.user_id, "chat"),
    //         active.getChatUsers(task.chat_id),
    //     ]);

    //     if (stats.length === 0) {
    //         await bot.api
    //             .sendMessage(task.chat_id, i18n.t(chatSettings.locale, "stats-empty-date"), {
    //                 message_thread_id: task.thread_id,
    //                 disable_notification: true,
    //             })
    //             .catch(() => {});
    //         return undefined;
    //     }
    // }

    public async prepareChatsRatingText() {
        const data = await Database.stats.bot.topChatsWeeklyRating();
        let chat = data[0];
        const top: string[] = [];
        for (let i = 0; i < data.length; i++) {
            chat = data[i];
            top.push(
                `${i === 0 ? "" : "\n"}${1 + i}.${await getPremiumMarkSpaced(
                    chat.chat_id,
                )}«${Escape.html(chat.title)}» - ${chat.total_messages.toLocaleString("fr-FR")}`,
            );
        }
        const text = top.join("");
        this.cache.statsText.set("chats_rating:weekly", text);
        return text;
    }

    public async prepareUserStatsText(
        chat_id: number,
        user_id: number,
        stats: IDBChatUserStatsAll,
        active: IActiveUser,
    ): Promise<string> {
        const text = await getUserStatsMessage(chat_id, user_id, stats, active);
        this.cache.statsText.set(getTaskId(chat_id, user_id, "all"), text);
        return text;
    }

    private async getChatStatsMessage(
        chat_id: number,
        chat_title: string,
        chatSettings: IChatSettings,
        stats: IDBChatUserStatsAndTotal[],
        activeUsers: Record<string, IActiveUser>,
        date_range: [string, string, IDateRange],
    ) {
        if (stats.length === 0) {
            return i18n.t(chatSettings.locale, "stats-empty-date");
        }
        // Custom date
        if (date_range[2] === "custom") {
            // Single date
            if (date_range[0] === date_range[1]) {
                if (!isValidDateOrDateRange([date_range[0]])) {
                    return i18n.t(chatSettings.locale, "stats-date-help");
                }

                return i18n.t(chatSettings.locale, "stats-chat-period", {
                    title: `${await getPremiumMarkSpaced(chat_id)}«${Escape.html(chat_title)}»`,
                    period: `${date_range[0]}\n\n${await getStatsChatRating(
                        stats,
                        activeUsers,
                        chatSettings,
                        1,
                        "date",
                        "text",
                    )}`,
                });
            } else {
                if (!isValidDateOrDateRange([date_range[0], date_range[1]])) {
                    return i18n.t(chatSettings.locale, "stats-date-help");
                }

                return i18n.t(chatSettings.locale, "stats-chat-period", {
                    title: `${await getPremiumMarkSpaced(chat_id)}«${Escape.html(chat_title)}»`,
                    period: `${date_range[0]} - ${date_range[1]}\n\n${await getStatsChatRating(
                        stats,
                        activeUsers,
                        chatSettings,
                        1,
                        "date",
                        "text",
                    )}`,
                });
            }
            // Predefined date range
        } else {
            return `${i18n.t(chatSettings.locale, "stats-chat-period", {
                title: `${await getPremiumMarkSpaced(chat_id)}«${Escape.html(chat_title)}»`,
                period: i18n.t(chatSettings.locale, `stats-period-${date_range[2]}`),
            })}\n\n${await getStatsChatRating(
                stats,
                activeUsers,
                chatSettings,
                1,
                date_range[2],
                // chart ? "caption" : "text"
                "caption",
            )}`;
        }
    }
}

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
    private statsTextService = StatsTextService.getInstance();
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
            (await this.statsTextService.prepareUserTopChatsText(
                ctx,
                await Database.stats.user.topChats(target_id),
            ));

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
        let target_id =
            isPersonal && ctx.msg.reply_to_message?.from
                ? ctx.msg.reply_to_message.from.id
                : ctx.from.id;
        const original_target = target_id;
        let userStatsPromise = Database.stats.user.all(chat_id, target_id);

        // TODO: implement user settings cache
        // let userSettingsPromise = Database.user.settings.get(target_id);
        const [users, chatSettings] = await Promise.all([
            active.getChatUsers(chat_id),
            SettingsService.getInstance().getChatSettings(chat_id),
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
            const statsText = await this.prepareUserStatsText(
                chat_id,
                target_id,
                await userStatsPromise,
                users[target_id],
            );
            this.removeCachedStatsText(chat_id, target_id, "all");
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: statsText,
                    chart: undefined,
                },
                chatSettings.selfdestructstats,
            );
            return;
        }

        const cachedChart = this.getCachedChart(chat_id, target_id, "user", "all");

        if (cachedChart.status === "ok") {
            const statsText = await this.prepareUserStatsText(
                chat_id,
                target_id,
                await userStatsPromise,
                users[target_id],
            );
            this.removeCachedStatsText(chat_id, target_id, "all");
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: true,
                    text: statsText,
                    chart: cachedChart.file_id,
                    chartFormat: cachedChart.chartFormat,
                },
                chatSettings.selfdestructstats,
            );
            return;
        }

        this.statsChartService.requestStatsChart(ctx, target_id, "user", "all");
        await this.prepareUserStatsText(
            chat_id,
            target_id,
            await userStatsPromise,
            users[target_id],
        );
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
            SettingsService.getInstance().getChatSettings(chat_id),
            active.getChatUsers(chat_id),
        ]);

        if (
            !chatSettings.charts ||
            date_range[2] === "yesterday" ||
            date_range[2] === "today" ||
            date_range[2] === "custom"
        ) {
            const statsText = await this.statsTextService.prepareChatStatsText(
                chat_id,
                ctx.chat.title,
                chatSettings,
                stats,
                activeUsers,
                date_range,
            );
            this.removeCachedStatsText(chat_id, chat_id, date_range[2]);
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: statsText,
                    chart: undefined,
                },
                chatSettings.selfdestructstats,
            );
            return;
        }

        const cachedChart = this.getCachedChart(chat_id, chat_id, "chat", date_range[2]);

        if (cachedChart.status === "ok") {
            const statsText = await this.statsTextService.prepareChatStatsText(
                chat_id,
                ctx.chat.title,
                chatSettings,
                stats,
                activeUsers,
                date_range,
            );
            this.removeCachedStatsText(chat_id, chat_id, date_range[2]);
            await sendSelfdestructMessage(
                ctx,
                {
                    isChart: true,
                    text: statsText,
                    chart: cachedChart.file_id,
                    chartFormat: cachedChart.chartFormat,
                },
                chatSettings.selfdestructstats,
            );
            return;
        }

        this.statsChartService.requestStatsChart(ctx, chat_id, "chat", date_range[2]);
        await this.statsTextService.prepareChatStatsText(
            chat_id,
            ctx.chat.title,
            chatSettings,
            stats,
            activeUsers,
            date_range,
        );
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
                caption: await this.statsTextService.prepareChatsRatingText(),
            });
            this.cache.statsText.delete("chats_rating:monthly");
            return;
        }

        this.statsChartService.requestBumpChartRating(ctx);
        await this.statsTextService.prepareChatsRatingText();
    }

    private async prepareUserStatsText(
        chat_id: number,
        user_id: number,
        stats: IDBChatUserStatsAll,
        active: IActiveUser,
    ): Promise<string> {
        const text = await getUserStatsMessage(chat_id, user_id, stats, active);
        this.cache.statsText.set(getTaskId(chat_id, user_id, "all"), text);
        return text;
    }

    private isPaginationNeeded(
        stats: IDBChatUserStatsAndTotal[],
        chatSettings: IChatSettings,
        users: Record<string, IActiveUser>,
    ) {
        const statsUsersCount = this.getStatsUsersCount(stats, users);
        return chatSettings.charts ? statsUsersCount > 25 : statsUsersCount > 50;
    }

    private getStatsUsersCount(
        stats: IDBChatUserStatsAndTotal[],
        users: Record<string, IActiveUser>,
    ): number {
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
            let from = this.normalizeDate(splittedCommand[1]);
            let to = this.normalizeDate(splittedCommand?.[2] || "");
            return [from, to || from, "custom"];
        }

        const rawCmdDateRange = (
            splittedCommand[1] ?? "today"
        ).toLowerCase() as keyof typeof cmdToDateRangeMap;

        return formattedDate[cmdToDateRangeMap[rawCmdDateRange]];
    }

    private normalizeDate(dateStr: string) {
        if (!dateStr) return "";
        const parts = dateStr.split(/-|\./);
        return parts[0].length === 4 ? dateStr : parts.reverse().join(".");
    }

    private removeCachedStatsText(chat_id: number, user_id: number, date_range: IDateRange) {
        this.cache.statsText.delete(getTaskId(chat_id, user_id, date_range));
    }

    private getCachedChart(
        chat_id: number,
        user_id: number,
        type: IChartType,
        rawDateRange: IAllowedChartStatsRanges = "all",
    ): IChartCache {
        return type === "chat"
            ? this.cache.chat.get(chat_id, rawDateRange)
            : this.cache.user.get(chat_id, user_id);
    }

    private resolveTargetUser(
        ctx: IGroupHearsCommandContext,
        users: Awaited<ReturnType<(typeof active)["getChatUsers"]>>,
    ): number {
        if (ctx.msg.reply_to_message?.from?.is_bot) {
            ctx.reply(ctx.t("robot-sounds")).catch((e) => {});
            return 0;
        }

        if (ctx.msg.reply_to_message?.from) {
            return ctx.msg.reply_to_message?.from?.id;
        }

        let userHint = (ctx.msg.text ?? ctx.msg.caption).split(" ").at(-1);
        if (userHint && userHint.startsWith("@")) {
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

        if (userHint && users?.[userHint]) {
            return +userHint;
        }

        return -1;
    }
}

export class StatsChartService {
    private static instance: StatsChartService;
    private isInitialized = false;
    private statsTextService = StatsTextService.getInstance();
    private getChartSettings = getChartSettings;
    private constructor(
        private rabbitMQClient: RabbitMQClient = RabbitMQClient.getInstance(
            cfg.RABBITMQ_USER,
            cfg.RABBITMQ_PASSWORD,
        ),
        private cache = CACHE,
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
        this.rabbitMQClient.consume<"chart_stats_results">(
            "chart_stats_results",
            this.chartConsumer.bind(this),
        );
        this.rabbitMQClient.consume<"bump_chart_rating_results">(
            "bump_chart_rating_results",
            this.bumpChartRatingConsumer.bind(this),
        );

        console.log("Chart consumers initialized");
    }

    public async requestStatsChart(
        ctx: IGroupHearsCommandContext | ChatTypeContext<IHearsCommandContext, "private">,
        target_id: number,
        type: IChartType,
        rawDateRange: IAllowedChartStatsRanges = "all",
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

            await this.rabbitMQClient.produce<"chart_stats_tasks">(
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
                },
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
            {},
        );
    }

    private async chartConsumer(task: IChartResult, msg: ConsumeMessage | null) {
        let text = this.cache.statsText.get(task.task_id);
        if (!text) {
            if (task.target_id > 0) {
                let [stats, userActive] = await Promise.all([
                    Database.stats.user.all(task.chat_id, task.target_id),
                    active.getUser(task.chat_id, task.target_id),
                ]);
                userActive ??= {
                    active_first: "",
                    active_last: "",
                    name: "",
                    nickname: "",
                    username: "",
                };
                text = await this.statsTextService.prepareUserStatsText(
                    task.chat_id,
                    task.target_id,
                    stats,
                    userActive,
                );
            } else {
                const [stats, chatSettings, activeUsers] = await Promise.all([
                    DBStats.chat.inRage(task.chat_id, task.date_range),
                    SettingsService.getInstance().getChatSettings(task.chat_id),
                    active.getChatUsers(task.chat_id),
                ]);
                text = await this.statsTextService.prepareChatStatsText(
                    task.chat_id,
                    "chat_title",
                    chatSettings,
                    stats,
                    activeUsers,
                    task.date_range,
                );
            }
        }

        let statsMsg: Message.PhotoMessage | Message.AnimationMessage | undefined;
        // TODO: message selfdestruction
        if (!task.raw) {
            void (await bot.api.sendMessage(task.chat_id, text || "").catch((e) => {
                console.error("[chartConsumer]: Error sending text:", e);
                return undefined;
            }));
        } else if (task.format === "image") {
            statsMsg = await bot.api
                .sendPhoto(task.chat_id, new InputFile(Buffer.from(task.raw)), {
                    caption: text || "",
                })
                .catch((e) => {
                    console.error("[chartConsumer]: Error sending photo:", e);
                    return undefined;
                });
        } else if (task.format === "video") {
            statsMsg = await bot.api
                .sendAnimation(task.chat_id, new InputFile(Buffer.from(task.raw)), {
                    caption: text || "",
                })
                .catch((e) => {
                    console.error("[chartConsumer]: Error sending video:", e);
                    return undefined;
                });
        }

        if (statsMsg) {
            this.cacheChart(statsMsg, task);
        }

        this.removeCachedStatsText(task.task_id);
        this.cache.pendingCharts.delete(task.task_id);
    }

    private async bumpChartRatingConsumer(
        task: IBumpChartRatingResult,
        msg: ConsumeMessage | null,
    ) {
        if (!task.raw) {
            console.error("Bump chart rating task has no raw data");
            return;
        }

        let text = this.cache.statsText.get(task.task_id);
        // TODO: fix possible race condition | Create separate charts text producer class
        text ??= "";

        bot.api
            .sendPhoto(task.chat_id, new InputFile(Buffer.from(task.raw)), { caption: text })
            .then((m) => {
                cacheManager.ChartCache_Global.set(
                    task.task_id,
                    m.photo[m.photo.length - 1].file_id,
                    getLastDayOfMonth(),
                );
            })
            .catch((e) => {
                console.error("Error sending bump chart rating:", e);
            });
    }

    private cacheChart(
        msg: Message.AnimationMessage | Message.PhotoMessage | undefined,
        task: IChartResult,
    ) {
        if (!msg) return;
        const file_id =
            "animation" in msg ? msg.animation?.file_id : msg.photo[msg.photo.length - 1].file_id;
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
