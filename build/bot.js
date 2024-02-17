"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const auto_retry_1 = require("@grammyjs/auto-retry");
const ignoreOldMessages_1 = require("./middlewares/ignoreOldMessages");
const addFullNameField_1 = require("./middlewares/addFullNameField");
const autoThreads_1 = require("./middlewares/autoThreads");
const start_1 = __importDefault(require("./ui/menus/start"));
const help_1 = __importDefault(require("./ui/menus/help"));
if (!process.env.BOT_TOKEN)
    throw new Error("Token required");
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
const autoRetryTransformer = (0, auto_retry_1.autoRetry)({
    maxDelaySeconds: 60,
    maxRetryAttempts: 3,
    retryOnInternalServerErrors: false,
});
bot.api.config.use(async (prev, method, payload, signal) => {
    if ([
        "getChat",
        "getChatMemberCount",
        "deleteMessage",
        "answerCallbackQuery",
    ].includes(method)) {
        return autoRetryTransformer(prev, method, payload, signal);
    }
    return prev(method, payload, signal);
});
bot.drop((0, grammy_1.matchFilter)(":is_automatic_forward"));
bot.use(ignoreOldMessages_1.ignoreOldMessages);
bot.use(addFullNameField_1.addFullNameField);
bot.use((0, autoThreads_1.autoThread)());
bot.use(start_1.default);
bot.use(help_1.default);
exports.default = bot;
