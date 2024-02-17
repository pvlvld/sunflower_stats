import "dotenv/config";
import bot from "./bot";
import { GrammyError, HttpError } from "grammy";
import * as http from "http";
import process from "node:process";
import { YAMLStats } from "./data/stats";
import { IActive } from "./data/active";
import DBPoolManager from "./db/db";
import DbStats from "./db/stats";
import regCommands from "./commands";
import DateRange from "./utils/date";
import formattedDate from "./utils/date";
import ActiveCollectorWrapper from "./middlewares/activeCollector";
import StatsCollectorWrapper from "./middlewares/statsCollector";
import createScheduler from "./utils/scheduler";
import YAMLWrapper from "./data/YAMLWrapper";
import regHandlers from "./handlers";
import { autoQuote } from "@roziscoding/grammy-autoquote";
import { autoThread } from "./middlewares/autoThreads";

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

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
  await DBPoolManager.createPool();

  const yamlStats = new YAMLStats(
    () => `stats${formattedDate.today}`, // statsYYYY-MM-DD.yaml
    "data/stats",
    DBPoolManager.getPool
  );
  const active = new YAMLWrapper<IActive>(() => "active", "data/active");
  const dbStats = new DbStats(DBPoolManager.getPool, DateRange);

  active.load();
  yamlStats.load();

  bot.use(ActiveCollectorWrapper(active, formattedDate));
  bot.use(StatsCollectorWrapper(yamlStats));
  bot.use(autoQuote);
  bot.use(autoThread());
  regHandlers(active, yamlStats);
  regCommands(dbStats, active, yamlStats);

  createScheduler(active, yamlStats);

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

    console.log("Bot is started.");
    bot.api.sendAnimation(
      "-1001898242958",
      "CgACAgIAAxkBAAIbKWWxO4FNC2yLM4-zkmnhLNEPcYy-AALUQAACLPtwSUWUvK8qKPSqNAQ",
      { caption: "Бота запущено!" }
    );
  });

  process.on("SIGINT", async () => await shutdown());
  process.on("SIGTERM", async () => await shutdown());

  let isShuttingDown = false;

  async function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

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

    active.save();
    yamlStats.save();

    console.log("Done.");
    process.exit();
  }
}

main();
