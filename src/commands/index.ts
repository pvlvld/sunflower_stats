import bot from "../bot";
import DbStats from "../db/stats";
import botTest_cmd from "./botTets";
import help_cmd from "./help";
import start_cmd from "./start";
import stats_all from "./stats_all";
import stats_month from "./stats_month";
import stats_today from "./stats_today";
import stats_week from "./stats_week";
import stats_yestarday from "./stats_yesterday";

function regCommands(dbStats: DbStats) {
  bot.hears(/^бот?$/i, async (ctx) => botTest_cmd(ctx));

  bot.command("help", async (ctx) => help_cmd(ctx));

  bot.command("start", async (ctx) => start_cmd(ctx));

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вчора$/i, async (ctx) => {
      stats_yestarday(ctx, dbStats);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата)\s*(сьогодні|день)?$/i, async (ctx) => {
      stats_today(ctx);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) тиждень$/i, async (ctx) => {
      stats_week(ctx, dbStats);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) місяць$/i, async (ctx) => {
      stats_month(ctx, dbStats);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вся$/i, async (ctx) => {
      stats_all(ctx, dbStats);
    });
}

export default regCommands;
