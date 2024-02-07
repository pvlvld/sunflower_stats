import "dotenv/config";
import bot from "./bot";
import { GrammyError, webhookCallback, HttpError } from "grammy";
import * as http from "http";
import process from "node:process";
import Stats from "./data/stats";
import Active from "./data/active";
import DBPoolManager from "./db/db";
import DbStats from "./db/stats";
import regCommands from "./commands";
import DateRange from "./utils/date";
import formattedDate from "./utils/date";
import ActiveCollectorWrapper from "./middlewares/activeCollector";
import StatsCollectorWrapper from "./middlewares/statsCollector";
// import { getPublicIP } from './utils/getPublicIP';
// import { startStatsCollecting } from './utils/statsCollector';

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

function loadData() {
  Stats.load();
  Active.load();
}

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

async function main() {
  let server: http.Server = {} as http.Server;
  loadData();
  await DBPoolManager.createPool();
  const dbStats = new DbStats(DBPoolManager.getPool, DateRange);
  bot.use(ActiveCollectorWrapper(Active, formattedDate));
  bot.use(StatsCollectorWrapper(yamlStats));
  regCommands(dbStats);
  // const [test, str] = await DBPoolManager.getPool.query(
  //   "SELECT user_id, count, name, username FROM stats_day_statistics WHERE date = '2024-02-02' AND chat_id = -1001898242958 ORDER BY count DESC"
  // );
  if (process.env.NODE_ENV === "production") {
    // const app = http.createServer(webhookCallback(bot, "http"));
    // server = app.listen(Number(process.env.PORT ?? 8443));
    // bot.api.deleteWebhook({ drop_pending_updates: true }).then(async () => {
    //   await bot.api
    //     .setWebhook(
    //       `https://${await getPublicIP()}/${String(process.env.BOT_TOKEN)}`
    //     )
    //     .catch((e) => {
    //       throw new Error(e);
    //     });
    // });
  } else if (process.env.NODE_ENV === "test") {
    const app = http.createServer(webhookCallback(bot, "http"));
    server = app.listen(Number(process.env.PORT ?? 8443));

    console.log("Started in test mode");
  } else {
    bot.api.deleteWebhook({ drop_pending_updates: true }).then(() => {
      bot.start({
        drop_pending_updates: true,
        allowed_updates: [
          "message",
          "my_chat_member",
          "chat_member",
          "callback_query",
        ],
      });

      // startStatsCollecting();
      console.log("Bot is started.");
    });
  }

  process.on("SIGINT", async () => await shutdown());
  process.on("SIGTERM", async () => await shutdown());

  let shutdownCounter = 0;

  async function shutdown() {
    if (shutdownCounter) return;
    shutdownCounter++;

    console.log("Shutting down.");
    await bot.api.deleteWebhook().then(() => {
      console.log("Webhook removed");
    });

    await bot.stop().then(() => {
      console.log("- Bot stopped.");
    });

    if ("close" in server) {
      server.close(() => {
        console.log("- Server closed.");
      });
    }

    console.log("Done.");
    process.exit();
  }
}

main();
