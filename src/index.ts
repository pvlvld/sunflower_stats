import "dotenv/config";
import bot from "./bot";
import { GrammyError, HttpError, webhookCallback } from "grammy";
import * as http from "http";
import process from "node:process";
import { TodayStats } from "./data/stats";
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
import moment from "moment";
import { botStatsManager } from "./commands/botStats";
import collectGarbage from "./utils/collectGarbage";
import { limit } from "@grammyjs/ratelimiter";
import * as fs from "fs";
import fastify from "fastify";
moment.locale("uk-UA");

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

  const active = new YAMLWrapper<IActive>(() => "active", "data/active");
  const todayStats = new TodayStats(
    () => `stats${formattedDate.today}`, // statsYYYY-MM-DD.yaml
    "data/stats"
  );
  const dbStats = new DbStats(DBPoolManager.getPool, DateRange);

  active.load();
  todayStats.load();

  bot.use(ActiveCollectorWrapper(active, formattedDate));
  bot.use(StatsCollectorWrapper(todayStats));
  bot.use(
    limit({
      timeFrame: 5000,
      limit: 1,
    })
  );
  bot.use(autoQuote);
  bot.use(autoThread());
  regHandlers(active, todayStats);
  regCommands(dbStats, active, todayStats);

  collectGarbage();

  createScheduler(active, todayStats);

  bot.api.deleteWebhook({ drop_pending_updates: true }).then(async () => {
    if (process.env.TEST === "test") {
      console.log("TEST MODE");
      const handleUpdate = webhookCallback(bot, "std/http");
      if (typeof Bun !== "undefined") {
        Bun.serve({
          async fetch(req) {
            try {
              return await handleUpdate(req);
            } catch (err) {
              console.error(err);
            }
          },
          port: 6666,
        });
      } else {
        const app = http.createServer(webhookCallback(bot, "http"));
        server = app.listen(Number(6666));
      }

      console.log("Started in test mode.");
    } else if (process.env.WEBHOOK) {
      if (typeof Bun !== "undefined") {
        const handleUpdate = webhookCallback(bot, "std/http");
        Bun.serve({
          async fetch(req) {
            console.log("New req!");
            if (req.method !== "POST") {
              return new Response();
            }

            try {
              return await handleUpdate(req);
            } catch (err) {
              console.error(err);
            }
          },
          port: 443,
        });
        bot.api.setWebhook(`https://80.64.218.61:443/`, {
          drop_pending_updates: true,
        });
      } else {
        const handleUpdate = webhookCallback(bot, "fastify");
        const server = fastify({
          https: {
            cert: fs.readFileSync(
              "/etc/letsencrypt/live/soniashnyk.pp.ua/fullchain.pem"
            ),
            key: fs.readFileSync(
              "/etc/letsencrypt/live/soniashnyk.pp.ua/privkey.pem"
            ),
          },
        });
        server.post(`/${process.env.BOT_TOKEN}`, (req) => {
          return handleUpdate(req);
        });

        server.setErrorHandler(async (error) => {
          console.error(error);
        });

        server.listen({ port: 443, host: "0.0.0.0" }, async (error) => {
          if (error) {
            console.error(error);
            process.exit(1);
          }
        });
        await bot.api.setWebhook(
          `https://soniashnyk.pp.ua/${process.env.BOT_TOKEN}`
        );
      }

      console.log("Bot is started using webhook.");
      console.log(await bot.api.getWebhookInfo());
    } else {
      bot.start({
        drop_pending_updates: true,
        allowed_updates: [
          "message",
          "my_chat_member",
          "chat_member",
          "callback_query",
        ],
      });
      console.log("Bot is started using long polling.");
    }

    bot.api.sendAnimation(
      "-1001898242958",
      "CgACAgQAAx0CcSTjjgABAhXRZdevgUUSZYWy2J7TCl_H_0RH1cIAAsQEAAL0Qn1T8YKWwZ59DLs0BA",
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
    todayStats.save();
    await botStatsManager.sendToMainChat();

    console.log("Done.");
    process.exit();
  }
}

main();
