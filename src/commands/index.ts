import bot from "../bot";
import botTest_cmd from "./botTets";
import chatInactive_cmd from "./chat_inactive";
import help_cmd from "./help";
import stats_my from "./stats_my";
import stats_their from "./stats_their";
import set_nickname from "./set_nickname";
import del_nickname from "./del_nickname";
import del_user_active from "./del_user_active";
import bot_stats_cmd, { botStatsManager } from "./botStats";
import collectGarbage from "../utils/collectGarbage";
import leaveChat_cmd from "./leaveChat";
import getChatAdmins_cmd from "./getChatAdmins";
import getChatInvite_cmd from "./getChatInvite";
import getUserId from "../utils/getUserId";
import parseCmdArgs from "../utils/parseCmdArgs";
import { removeAnonimousActive } from "./staff/utils_cmd";
import broadcast_owners_cmd from "./staff/broadcast_owners";
import bench_db_cmd from "./staff/bench_db";
import cfg from "../config";
import botMemoryUsage from "./staff/botMemoryUsage";
import { chatCleanup } from "./chatCleanup";
import removeFromChatCleanup from "./removeFromChatCleanup";
import stats_chat_range_cmd from "./stats_chat_range";
import memes from "./memes";
import stats_chat from "./stats_chat";
import { monomorphic_active } from "./staff/monomorphic_active";
import { removeChatData_cmd } from "./staff/removeChatData";

function regCommands() {
  const group = bot.chatType(["supergroup", "group"]);
  const botAdmin = group.filter((ctx) => cfg.ADMINS.includes(ctx.from?.id || -1));

  bot.command(["help", "start"], async (ctx) => {
    if (
      ["supergroup", "group"].includes(ctx.msg.chat.type) &&
      ctx.msg.text.indexOf("@soniashnyk_statistics_bot") === -1 &&
      ctx.msg.text.indexOf("@testSun203_bot") === -1
    ) {
      return;
    }

    botStatsManager.commandUse("help");
    help_cmd(ctx);
  });

  group.hears(/^(стата|статистика)$/i, async (ctx) => {
    stats_chat(ctx);
  });

  group.hears(/^(стата|статистика) (сьогодні|вся|тиждень|місяць|вчора|рік)$/i, async (ctx) => {
    stats_chat(ctx);
  });

  group.hears(/^(статистика|стата) \d{4}\.\d{2}\.\d{2}( \d{4}\.\d{2}\.\d{2})?$/, async (ctx) => {
    botStatsManager.commandUse("стата дата");
    stats_chat_range_cmd(ctx);
  });

  group.hears(/^(!я|!йа)$/i, async (ctx) => {
    botStatsManager.commandUse("я");
    stats_my(ctx);
  });

  group.hears(/^(!ти)/i, async (ctx) => {
    if (
      (!ctx.msg.reply_to_message && !ctx.msg?.text?.startsWith("!ти ")) ||
      (ctx.msg.reply_to_message && !(ctx.msg?.text === "!ти"))
    ) {
      return;
    }
    botStatsManager.commandUse("ти");
    stats_their(ctx);
  });

  group.hears(/^(\+нік|\+нікнейм)/i, async (ctx) => {
    botStatsManager.commandUse("нік");
    set_nickname(ctx);
  });

  group.hears(/^(-нік|-нікнейм)/i, async (ctx) => {
    botStatsManager.commandUse("нік");
    del_nickname(ctx);
  });

  group.hears(/^(!інактив|!неактив)/i, async (ctx) => {
    botStatsManager.commandUse("інактив");
    chatInactive_cmd(ctx);
  });

  group.hears(/^!ссприховати/i, async (ctx) => {
    botStatsManager.commandUse("ссприховати");
    del_user_active(ctx);
  });

  group.hears(/^!чистка \d+ \d/, async (ctx) => {
    botStatsManager.commandUse("чистка");
    chatCleanup(ctx);
  });

  group.hears(/^!рест/, async (ctx) => {
    removeFromChatCleanup(ctx);
  });

  // -------- STAFF COMMANDS --------

  bot.hears(/^бот\?$/i, async (ctx) => botTest_cmd(ctx));

  botAdmin.hears("!ssstats", async (ctx) => bot_stats_cmd(ctx));

  botAdmin.hears("!ssreset stats", (ctx) => botStatsManager.resetAll());

  botAdmin.hears("!ssreset msg", (ctx) => botStatsManager.resetMessages());

  botAdmin.hears("!ssgc", (ctx) => collectGarbage());

  botAdmin.hears("!ssshrink", (ctx) => {
    if (typeof Bun !== "undefined") {
      Bun.shrink();
    }
  });

  botAdmin.hears(/^!ssleave/, (ctx) => leaveChat_cmd(ctx));

  botAdmin.hears(/^!ssadmins/, (ctx) => getChatAdmins_cmd(ctx));

  botAdmin.hears(/^!ssinvite/, (ctx) => getChatInvite_cmd(ctx));

  botAdmin.hears(/^!ssru/, (ctx) => {
    const wantedUser = parseCmdArgs(ctx.msg?.text ?? ctx.msg?.caption)[0];
    if (wantedUser) {
      ctx.reply(String(getUserId(wantedUser, ctx.chat.id)));
    }
  });

  botAdmin.hears(/^!ssremoveanon/, (ctx) => removeAnonimousActive(ctx));

  botAdmin.hears("!ssbroadcast_owners", (ctx) => broadcast_owners_cmd(ctx));

  botAdmin.hears("!ssbroadcast_chats", (ctx) => broadcast_chats_cmd(ctx));

  botAdmin.hears(/^!ssbdb/, (ctx) => bench_db_cmd(ctx));

  botAdmin.hears("!ssmem", async (ctx) => botMemoryUsage(ctx));

  botAdmin.hears("!monoactive", async () => monomorphic_active());

  botAdmin.hears(/^!ssrc/, async (ctx) => removeChatData_cmd(ctx));
  // Etc.

  bot.on("message", async (ctx) => {
    memes(ctx);
  });
}
export default regCommands;
