"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bot_1 = __importDefault(require("./bot"));
const grammy_1 = require("grammy");
const node_process_1 = __importDefault(require("node:process"));
const stats_1 = require("./data/stats");
const db_1 = __importDefault(require("./db/db"));
const stats_2 = __importDefault(require("./db/stats"));
const commands_1 = __importDefault(require("./commands"));
const date_1 = __importDefault(require("./utils/date"));
const date_2 = __importDefault(require("./utils/date"));
const activeCollector_1 = __importDefault(require("./middlewares/activeCollector"));
const statsCollector_1 = __importDefault(require("./middlewares/statsCollector"));
const scheduler_1 = __importDefault(require("./utils/scheduler"));
const YAMLWrapper_1 = __importDefault(require("./data/YAMLWrapper"));
const handlers_1 = __importDefault(require("./handlers"));
node_process_1.default.on("uncaughtException", function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});
bot_1.default.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof grammy_1.GrammyError) {
        console.error("Error in request:", e.description);
    }
    else if (e instanceof grammy_1.HttpError) {
        console.error("Could not contact Telegram:", e);
    }
    else {
        console.error("Unknown error:", e);
    }
});
async function main() {
    let server = {};
    await db_1.default.createPool();
    const yamlStats = new stats_1.YAMLStats(() => `stats${date_2.default.today}`, "data/stats", db_1.default.getPool);
    const active = new YAMLWrapper_1.default(() => "active", "data/active");
    const dbStats = new stats_2.default(db_1.default.getPool, date_1.default);
    active.load();
    yamlStats.load();
    bot_1.default.use((0, activeCollector_1.default)(active, date_2.default));
    bot_1.default.use((0, statsCollector_1.default)(yamlStats));
    (0, handlers_1.default)(active, yamlStats);
    (0, commands_1.default)(dbStats, active, yamlStats);
    (0, scheduler_1.default)(active, yamlStats);
    bot_1.default.api.deleteWebhook({ drop_pending_updates: true }).then(() => {
        bot_1.default.start({
            drop_pending_updates: true,
            allowed_updates: [
                "message",
                "my_chat_member",
                "chat_member",
                "callback_query",
            ],
        });
        console.log("Bot is started.");
        bot_1.default.api.sendAnimation("-1001898242958", "CgACAgIAAxkBAAIbKWWxO4FNC2yLM4-zkmnhLNEPcYy-AALUQAACLPtwSUWUvK8qKPSqNAQ", { caption: "Бота запущено!" });
    });
    node_process_1.default.on("SIGINT", async () => await shutdown());
    node_process_1.default.on("SIGTERM", async () => await shutdown());
    let shutdownCounter = 0;
    async function shutdown() {
        if (shutdownCounter)
            return;
        shutdownCounter++;
        console.log("Shutting down.");
        await bot_1.default.api.deleteWebhook().then(() => {
            console.log("Webhook removed");
        });
        await bot_1.default.stop().then(() => {
            console.log("- Bot stopped.");
        });
        if ("close" in server) {
            server.close(() => {
                console.log("- Server closed.");
            });
        }
        active.save();
        yamlStats.save();
        console.log("Done.");
        node_process_1.default.exit();
    }
}
main();
