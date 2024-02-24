import bot from "../bot";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import TodayStats from "../data/stats";
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
import del_user_active from "./del_user_active";
import bot_stats_cmd, { botStatsManager } from "./botStats";
import collectGarbage from "../utils/collectGarbage";
import leaveChat_cmd from "./leaveChat";
import getChatAdmins_cmd from "./getChatAdmins";
import getChatInvite_cmd from "./getChatInvite";

const ADMINS = (process.env.ADMINS?.split(" ") || []).map((id) => Number(id));

function regCommands(
  dbStats: DbStats,
  active: YAMLWrapper<IActive>,
  todayStats: TodayStats
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
      stats_today(ctx, todayStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) тиждень$/i, async (ctx) => {
      botStatsManager.commandUse("стата тиждень");
      stats_week(ctx, dbStats, todayStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) місяць$/i, async (ctx) => {
      botStatsManager.commandUse("стата місяць");
      stats_month(ctx, dbStats, todayStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) рік$/i, async (ctx) => {
      botStatsManager.commandUse("стата рік");
      stats_year(ctx, dbStats, todayStats, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(статистика|стата) вся$/i, async (ctx) => {
      botStatsManager.commandUse("стата вся");
      stats_all(ctx, dbStats, todayStats, active);
    });

  bot.chatType(["group", "supergroup"]).hears(/^(!я|!йа)$/i, async (ctx) => {
    botStatsManager.commandUse("я");
    stats_my(ctx, dbStats, todayStats, active);
  });

  bot.chatType(["group", "supergroup"]).hears(/^(!ти)$/i, async (ctx) => {
    botStatsManager.commandUse("ти");
    stats_their(ctx, dbStats, todayStats, active);
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

  bot
    .chatType(["group", "supergroup"])
    .hears(/^(!інактив|!неактив)/i, async (ctx) => {
      botStatsManager.commandUse("інактив");
      //@ts-expect-error
      chatInactive_cmd(ctx, active);
    });

  bot
    .chatType(["group", "supergroup"])
    .command("del_from_active", async (ctx) => {
      if (ctx.message?.reply_to_message) del_user_active(ctx, active);
    });

  // -------- STAFF COMMANDS --------

  bot.hears(/^бот\?$/i, async (ctx) => botTest_cmd(ctx));

  bot.chatType(["group", "supergroup"]).hears("bot stats", async (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) bot_stats_cmd(ctx);
  });

  bot.hears("migrate data", (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1))
      migrateData(ctx, todayStats, active);
  });

  bot.hears("reset stats", (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) botStatsManager.resetAll();
  });

  bot.hears("reset msg", (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) botStatsManager.resetMessages();
  });

  bot.hears("gc", (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      collectGarbage();
    }
  });

  bot.hears("shrink", (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      if (typeof Bun !== "undefined") {
        Bun.shrink();
      }
    }
  });

  bot.hears(/^!ssleave/, (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      leaveChat_cmd(ctx);
    }
  });

  bot.hears(/^!ssadmins/, (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      getChatAdmins_cmd(ctx);
    }
  });

  bot.hears(/^!ssinvite/, (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      getChatInvite_cmd(ctx);
    }
  });

  bot.hears(/^!ssforceclearstats/, (ctx) => {
    if (ADMINS.includes(ctx.from?.id || -1)) {
      todayStats.clear();
    }
  });
}

export default regCommands;
