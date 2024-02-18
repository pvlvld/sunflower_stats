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
import set_nickname from "./set_nickname";
import del_nickname from "./del_nickname";
import bot_stats_cmd, { botStatsManager } from "./botStats";

function regCommands(
  dbStats: DbStats,
  active: YAMLWrapper<IActive>,
  yamlStats: YAMLStats
) {
  bot.command("help", async (ctx) => {
    botStatsManager.commandUse("help");
    help_cmd(ctx);
  });

  bot.command("start", async (ctx) => {
    botStatsManager.commandUse("start");
    start_cmd(ctx);
  });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вчора$/i, async (ctx) => {
      botStatsManager.commandUse("стата вчора");
      stats_yestarday(ctx, dbStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата)\s*(сьогодні|день)?$/i, async (ctx) => {
      botStatsManager.commandUse("стата сьогодні");
      stats_today(ctx, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) тиждень$/i, async (ctx) => {
      botStatsManager.commandUse("стата тиждень");
      stats_week(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) місяць$/i, async (ctx) => {
      botStatsManager.commandUse("стата місяць");
      stats_month(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) рік$/i, async (ctx) => {
      botStatsManager.commandUse("стата рік");
      stats_year(ctx, dbStats, yamlStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вся$/i, async (ctx) => {
      botStatsManager.commandUse("стата вся");
      stats_all(ctx, dbStats, yamlStats, active);
    });

  bot.chatType(["group", "supergroup"]).hears(/^(!я|!йа)$/i, async (ctx) => {
    botStatsManager.commandUse("я");
    stats_my(ctx, dbStats, yamlStats, active);
  });

  bot.chatType(["group", "supergroup"]).hears(/^(!ти)$/i, async (ctx) => {
    botStatsManager.commandUse("ти");
    stats_their(ctx, dbStats, yamlStats, active);
  });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(\+нік|\+нікнейм)/i, async (ctx) => {
      botStatsManager.commandUse("нік");
      set_nickname(ctx, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(\-нік|\-нікнейм)/i, async (ctx) => {
      botStatsManager.commandUse("нік");
      del_nickname(ctx, active);
    });

  bot.chatType(["group", "supergroup"]).hears(/^(!інактив)/i, async (ctx) => {
    botStatsManager.commandUse("інактив");
    //@ts-expect-error
    chatInactive_cmd(ctx, active);
  });

  // -------- STAFF COMMANDS --------

  bot.hears(/^бот?$/i, async (ctx) => botTest_cmd(ctx));

  bot.chatType(["group", "supergroup"]).hears("bot stats", async (ctx) => {
    if (ctx.from?.id === 6102695950) bot_stats_cmd(ctx);
  });

  bot.hears("migrate data", (ctx) => {
    if (ctx.from?.id === 6102695950) migrateData(ctx);
  });

  bot.hears("reset stats", (ctx) => {
    if (ctx.from?.id === 6102695950) botStatsManager.resetAll();
  });

  bot.hears("reset msg", (ctx) => {
    if (ctx.from?.id === 6102695950) botStatsManager.resetMessages();
  });
}

export default regCommands;
