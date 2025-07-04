import { DBPoolManager, IDBPoolManager } from "./db/poolManager.js";
import ActiveCollectorWrapper from "./middlewares/activeCollector.js";
import StatsCollectorWrapper from "./middlewares/statsCollector.js";
import { autoQuote } from "@roziscoding/grammy-autoquote";
import { autoThread } from "./middlewares/autoThreads.js";
import { botStatsManager } from "./commands/botStats.js";
import collectGarbage from "./utils/collectGarbage.js";
import createScheduler from "./utils/scheduler.js";
import { GrammyError, HttpError } from "grammy";
import regCommands from "./commands/index.js";
import regHandlers from "./handlers/index.js";
import { limit } from "@grammyjs/ratelimiter";
import createServer from "./server.js";
import { run } from "@grammyjs/runner";
import process from "node:process";
import cfg from "./config.js";
import * as http from "http";
import moment from "moment";
import bot from "./bot.js";
import { chatMigrationHandler } from "./handlers/chatMigrationHandler.js";
import { messagesStatsBatchStore } from "./data/messagesStatsBatchStore.js";
import cacheManager from "./cache/cache.js";
import { LocaleService } from "./cache/localeService.js";
moment.locale("uk-UA");

process.on("uncaughtException", function (err) {
    console.error("You Shall Not Pass!");
    console.error(err);
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        if (e.parameters.migrate_to_chat_id) {
            chatMigrationHandler.handleFromError(e);
        }
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

async function main() {
    let server: http.Server | ReturnType<typeof createServer>;
    let runner: ReturnType<typeof run> = undefined as any;

    const allowed_updates = ["message", "chat_member", "my_chat_member", "callback_query", "edited_message"] as const;

    regHandlers();
    bot.use(ActiveCollectorWrapper());
    bot.use(StatsCollectorWrapper());
    bot.use(
        limit({
            timeFrame: 1500,
            limit: 1,
        })
    );
    bot.use(autoQuote({ allowSendingWithoutReply: true }));
    bot.use(autoThread());
    regCommands();
    await LocaleService.seed();
    collectGarbage();

    createScheduler();

    bot.api.deleteWebhook({ drop_pending_updates: true }).then(async () => {
        if (process.env.WEBHOOK) {
            server = createServer();
            server.listen({ port: 443, host: "0.0.0.0" }, async (error) => {
                if (error) {
                    console.error(error);
                    process.exit(1);
                }
            });
            await bot.api.setWebhook(`https://soniashnyk.pp.ua/${cfg.BOT_TOKEN}`, {
                drop_pending_updates: true,
                allowed_updates,
            });

            console.log("Bot is started using webhook.");
            console.log(await bot.api.getWebhookInfo());
        } else {
            run(bot, { runner: { fetch: { allowed_updates } } });
            console.log("Bot is started using long polling.");
        }

        await bot.api
            .sendAnimation(cfg.ANALYTICS_CHAT, cfg.MEDIA.ANIMATIONS.ThePrimeagen, {
                caption: "Бота запущено!",
            })
            .catch((e) => {});

        // addButtonToThePost(14, -1002188288504, "зіграти в гру", "https://t.me/+pX0GCECNRl1iYTli");
    });

    process.on("SIGINT", async () => await shutdown(DBPoolManager));
    process.on("SIGTERM", async () => await shutdown(DBPoolManager));

    let isShuttingDown = false;

    async function shutdown(DBPoolManager: IDBPoolManager) {
        if (isShuttingDown) return;
        isShuttingDown = true;
        cfg.SET_STATUS("stopping");
        console.log("Shutting down.");

        await runner?.stop().catch(console.error);

        await bot.stop().catch(console.error);
        console.log("- Bot stopped.");

        await bot.api.deleteWebhook({ drop_pending_updates: true }).catch(console.error);
        console.log("- Webhook removed");

        if (server && "close" in server) {
            server.close(() => {
                console.log("- Server closed.");
            });
        }

        await messagesStatsBatchStore.writeBatch();
        await botStatsManager.sendToAnalyticsChat().catch(console.error);
        await DBPoolManager.shutdown().catch(console.error);

        console.log("Done.");
        console.log(`Running NodeJS ${process.version}`);
        process.exit();
    }

    console.log(`Running NodeJS ${process.version}`);
    await cacheManager.PremiumStatusCache.seed_chats();
}

main();
// addButtonToThePost(16, -1002188288504, "Welcome to Unicorn Mafia 🦄", "https://t.me/+ucM55jyWpK5iY2My");
function addButtonToThePost(messageId: number, chatId: number, text: string, url: string) {
    return bot.api.editMessageReplyMarkup(chatId, messageId, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text,
                        url,
                    },
                ],
            ],
        },
    });
}
