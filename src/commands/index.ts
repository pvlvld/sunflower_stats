import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { setUserJoinDate_cmd } from "./staff/setUserJoinDate.js";
import { scanChatHistory_cmd } from "./staff/scanChatHistory.js";
import bot_stats_cmd, { botStatsManager } from "./botStats.js";
import broadcast_owners_cmd from "./staff/broadcast_owners.js";
import removeFromChatCleanup from "./removeFromChatCleanup.js";
import { removeChatData_cmd } from "./staff/removeChatData.js";
import { removeAnonimousActive } from "./staff/utils_cmd.js";
import broadcast_chats_cmd from "./staff/broadcast_chats.js";
import { donate_cmd, refreshDonate_cmd } from "./donate.js";
import stats_chat_range_cmd from "./stats_chat_range.js";
import collectGarbage from "../utils/collectGarbage.js";
import botMemoryUsage from "./staff/botMemoryUsage.js";
import { isChatAdmin } from "../utils/isChatAdmin.js";
import { chatSettings_cmd } from "./chatSettings.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import del_user_active from "./del_user_active.js";
import getChatAdmins_cmd from "./getChatAdmins.js";
import getChatInvite_cmd from "./getChatInvite.js";
import chatInactive_cmd from "./chat_inactive.js";
import isChatOwner from "../utils/isChatOwner.js";
import { chatCleanup } from "./chatCleanup.js";
import getUserId from "../utils/getUserId.js";
import { getId_cmd } from "./staff/get_id.js";
import set_nickname from "./set_nickname.js";
import del_nickname from "./del_nickname.js";
import { stats_user } from "./stats_user.js";
import { delMessage } from "./staff/del.js";
import leaveChat_cmd from "./leaveChat.js";
import { setChartBg } from "./chartBg.js";
import stats_chat from "./stats_chat.js";
import { ban_cmd } from "./staff/ban.js";
import botTest_cmd from "./botTets.js";
import { hello } from "./hello.js";
import help_cmd from "./help.js";
import cfg from "../config.js";
import memes from "./memes.js";
import bot from "../bot.js";

function regCommands() {
  const group = bot.chatType(["supergroup", "group"]);
  const botAdmin = group.filter((ctx) => cfg.ADMINS.includes(ctx.from?.id || -1));
  const groupStats = group.filter(async (ctx) => {
    if ((await getCachedOrDBChatSettings(ctx.chat.id)).statsadminsonly) {
      if (ctx.from?.id && (await isChatAdmin(ctx.chat.id, ctx.from.id))) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  });

  bot.command("donate", async (ctx) => donate_cmd(ctx));

  bot.command("refreshDonate", async (ctx) => {
    refreshDonate_cmd(ctx);
  });

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

  groupStats.hears(/^(!?)(стата|статистика)$/i, async (ctx) => {
    stats_chat(ctx);
  });

  groupStats.hears(
    /^(!?)(стата|статистика) (сьогодні|вся|тиждень|місяць|вчора|рік)$/i,
    async (ctx) => {
      stats_chat(ctx);
    }
  );

  groupStats.hears(
    /^(!?)(стата|статистика) \d{4}\.\d{2}\.\d{2}( \d{4}\.\d{2}\.\d{2})?$/,
    async (ctx) => {
      botStatsManager.commandUse("стата дата");
      stats_chat_range_cmd(ctx);
    }
  );

  groupStats.hears(/^(!я|!йа|хто я)$/i, async (ctx) => {
    botStatsManager.commandUse("я");
    stats_user(ctx, "я");
  });

  groupStats.hears(/^(!ти|хто ти)/i, async (ctx) => {
    if (
      (!ctx.msg.reply_to_message && !ctx.msg?.text?.startsWith("!ти ")) ||
      (ctx.msg.reply_to_message && !["!ти", "хто ти"].includes(ctx.msg?.text || ""))
    ) {
      return;
    }
    botStatsManager.commandUse("ти");
    stats_user(ctx, "ти");
  });

  group.hears(/^(\+нік|\+нікнейм)/i, async (ctx) => {
    botStatsManager.commandUse("нік");
    set_nickname(ctx);
  });

  group.hears(/^(-нік|-нікнейм)/i, async (ctx) => {
    botStatsManager.commandUse("нік");
    del_nickname(ctx);
  });

  groupStats.hears(/^(!інактив|!неактив)/i, async (ctx) => {
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

  group.hears("!стата фон я", (ctx) => {
    setChartBg(ctx, "user");
  });
  group.hears(/^\/setmybg/i, (ctx) => {
    setChartBg(ctx, "user");
  });

  group.hears("!стата фон чат", async (ctx) => {
    if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
      setChartBg(ctx, "chat");
    }
  });
  group.hears(/^\/setchatbg/i, async (ctx) => {
    if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
      setChartBg(ctx, "chat");
    }
  });

  group.hears("!settings", async (ctx) => {
    chatSettings_cmd(ctx);
  });
  group.hears("!налаштування", async (ctx) => {
    chatSettings_cmd(ctx);
  });
  group.command("settings", async (ctx) => {
    chatSettings_cmd(ctx);
  });

  group.hears(/^!дата вступу/, (ctx) => {
    setUserJoinDate_cmd(ctx);
  });

  // -------- STAFF COMMANDS --------

  bot.hears(/^бот(\??)$/i, async (ctx) => botTest_cmd(ctx));

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

  botAdmin.hears("!ssmem", async (ctx) => botMemoryUsage(ctx));

  botAdmin.hears(/^!ssrc/, async (ctx) => removeChatData_cmd(ctx));
  // Etc.

  group.hears("/getid", async (ctx) => {
    getId_cmd(ctx);
  });

  group.hears("!sdel", async (ctx) => {
    if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
      await delMessage(ctx);
    }
  });

  bot.hears("!hello", async (ctx) => {
    await hello(ctx);
  });

  group.hears("!sban", async (ctx) => {
    if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
      ban_cmd(ctx);
    }
  });

  group.hears(/^!sscanh/, async (ctx) => {
    if (!cfg.ADMINS.includes(ctx.from.id)) {
      return;
    }

    scanChatHistory_cmd(ctx);
  });

  // MUST BE THE LAST ONE
  bot.on("message", async (ctx) => {
    memes(ctx);
  });
}
export default regCommands;
