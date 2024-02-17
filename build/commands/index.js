"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = __importDefault(require("../bot"));
const botTets_1 = __importDefault(require("./botTets"));
const chat_inactive_1 = __importDefault(require("./chat_inactive"));
const help_1 = __importDefault(require("./help"));
const migrateData_1 = __importDefault(require("./migrateData"));
const start_1 = __importDefault(require("./start"));
const stats_all_1 = __importDefault(require("./stats_all"));
const stats_month_1 = __importDefault(require("./stats_month"));
const stats_my_1 = __importDefault(require("./stats_my"));
const stats_their_1 = __importDefault(require("./stats_their"));
const stats_today_1 = __importDefault(require("./stats_today"));
const stats_week_1 = __importDefault(require("./stats_week"));
const stats_year_1 = __importDefault(require("./stats_year"));
const stats_yesterday_1 = __importDefault(require("./stats_yesterday"));
const add_nickname_1 = __importDefault(require("./add_nickname"));
function regCommands(dbStats, active, yamlStats) {
    bot_1.default.hears(/^бот?$/i, async (ctx) => (0, botTets_1.default)(ctx));
    bot_1.default.command("help", async (ctx) => (0, help_1.default)(ctx));
    bot_1.default.command("start", async (ctx) => (0, start_1.default)(ctx));
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата) вчора$/i, async (ctx) => {
        (0, stats_yesterday_1.default)(ctx, dbStats);
    });
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата)\s*(сьогодні|день)?$/i, async (ctx) => {
        (0, stats_today_1.default)(ctx, yamlStats, active);
    });
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата) тиждень$/i, async (ctx) => {
        (0, stats_week_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата) місяць$/i, async (ctx) => {
        (0, stats_month_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата) рік$/i, async (ctx) => {
        (0, stats_year_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default
        .chatType(["group", "supergroup"])
        .hears(/^(статистика|стата) вся$/i, async (ctx) => {
        (0, stats_all_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default.hears("migrate data", (ctx) => {
        if (ctx.from?.id === 6102695950)
            (0, migrateData_1.default)(ctx);
    });
    bot_1.default.chatType(["group", "supergroup"]).hears(/^(!я|!йа)$/i, async (ctx) => {
        (0, stats_my_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default.chatType(["group", "supergroup"]).hears(/^(!ти)$/i, async (ctx) => {
        (0, stats_their_1.default)(ctx, dbStats, yamlStats, active);
    });
    bot_1.default.chatType(["group", "supergroup"]).hears(/^((\+нік|\+нікнейм) .*)$/i, async (ctx) => {
        (0, add_nickname_1.default)(ctx, active);
    });
    bot_1.default.chatType(["group", "supergroup"]).hears(/^(!інактив)/i, async (ctx) => {
        (0, chat_inactive_1.default)(ctx, active);
    });
}
exports.default = regCommands;
