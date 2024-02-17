import bot from "../bot";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import YAMLStats from "../data/stats";
import DbStats from "../db/stats";
import botTest_cmd from "./botTets";
import chatInactive_cmd from "./chat_inactive";
import help_cmd from "./help";
import migrateData from "./migrateData";
import start_cmd from "./start";
import stats_all from "./stats_all";
import stats_month from "./stats_month";
import stats_my from "./stats_my";
import stats_their from "./stats_their";
import stats_today from "./stats_today";
import stats_week from "./stats_week";
import stats_year from "./stats_year";
import stats_yestarday from "./stats_yesterday";
import add_nickname from "./add_nickname";

function regCommands(
  dbStats: DbStats,
  active: YAMLWrapper<IActive>,
  yamlStats: YAMLStats
) {
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
      stats_today(ctx, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) тиждень$/i, async (ctx) => {
      stats_week(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) місяць$/i, async (ctx) => {
      stats_month(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) рік$/i, async (ctx) => {
      stats_year(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вся$/i, async (ctx) => {
      stats_all(ctx, dbStats, yamlStats, active);
    });

  bot.hears("migrate data", (ctx) => {
    if (ctx.from?.id === 6102695950) migrateData(ctx);
  });

  bot.chatType(["group", "supergroup"]).hears(/^(!я|!йа)$/i, async (ctx) => {
    stats_my(ctx, dbStats, yamlStats, active);
  });

  bot.chatType(["group", "supergroup"]).hears(/^(!ти)$/i, async (ctx) => {
    stats_their(ctx, dbStats, yamlStats, active);
  });
  bot.chatType(["group", "supergroup"]).hears(/^((\+нік|\+нікнейм) .*)$/i, async (ctx) => {
    add_nickname(ctx, active);
  });
  bot.chatType(["group", "supergroup"]).hears(/^(!інактив)/i, async (ctx) => {
    //@ts-expect-error
    chatInactive_cmd(ctx, active);
  });
}

export default regCommands;
