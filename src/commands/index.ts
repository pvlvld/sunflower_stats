import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { setUserJoinDate_cmd } from "./staff/setUserJoinDate.js";
import { scanChatHistory_cmd } from "./staff/scanChatHistory.js";
import bot_stats_cmd, { botStatsManager } from "./botStats.js";
import broadcast_owners_cmd from "./staff/broadcast_owners.js";
import removeFromChatCleanup from "./removeFromChatCleanup.js";
import { removeChatData_cmd } from "./staff/removeChatData.js";
import broadcast_chats_cmd from "./staff/broadcast_chats.js";
import { donate_cmd, refreshDonate_cmd } from "./donate.js";
import stats_chat_range_cmd from "./stats_chat_range.js";
import { broadcast_adv } from "./staff/broadcast_adv.js";
import collectGarbage from "../utils/collectGarbage.js";
import { toggleCharts } from "./staff/toggleCharts.js";
import botMemoryUsage from "./staff/botMemoryUsage.js";
import { isChatAdmin } from "../utils/isChatAdmin.js";
import { chatSettings_cmd } from "./chatSettings.js";
import { clearGroupActive, clearOldBotActive } from "./staff/clearActive.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import del_user_active from "./del_user_active.js";
import getChatAdmins_cmd from "./getChatAdmins.js";
import getChatInvite_cmd from "./getChatInvite.js";
import { setChartColor } from "./setChartColor.js";
import chatInactive_cmd from "./chat_inactive.js";
import isChatOwner from "../utils/isChatOwner.js";
import { setLogLvl } from "./staff/setLogLvl.js";
import { chatCleanup } from "./chatCleanup.js";
import getUserId from "../utils/getUserId.js";
import { getId_cmd } from "./staff/get_id.js";
import set_nickname from "./set_nickname.js";
import { react_cmd } from "./staff/react.js";
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
import { unban_owners_cmd } from "./staff/unban_owners.js";
import { remote_ban_cmd } from "./staff/remote_ban.js";
import { addToBlacklist } from "./staff/blacklist.js";
import { start_cmd } from "./start.js";
import { updateDbChatsInfo } from "./staff/updateDbChatsInfo.js";
import { stats_user_global } from "./stats_user_global.js";
import { statsChatGlobal } from "./statsChatGlobal.js";

function regCommands() {
    const group = bot.chatType(["supergroup", "group"]);
    const dm = bot.chatType("private");
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

    dm.command(["me", "i"], stats_user_global);
    bot.command("donate", donate_cmd);

    groupStats.command("w", async (ctx) => {
        ctx.msg.text = "стата тиждень";
        // @ts-expect-error
        await stats_chat(ctx);
    });
    groupStats.command("m", async (ctx) => {
        ctx.msg.text = "стата місяць";
        // @ts-expect-error
        await stats_chat(ctx);
    });
    groupStats.command("y", async (ctx) => {
        ctx.msg.text = "стата рік";
        // @ts-expect-error
        await stats_chat(ctx);
    });

    bot.command("refreshDonate", refreshDonate_cmd);
    bot.command("start", start_cmd);
    group.command(["help"], async (ctx) => {
        botStatsManager.commandUse("help");
        help_cmd(ctx);
    });

    // STATS
    //@ts-expect-error
    groupStats.command("stats", stats_chat);
    groupStats.hears(/^(стата|статистика)$/i, stats_chat);

    groupStats.hears(/^(!?)(стата|статистика) \d{4}\.\d{2}\.\d{2}( \d{4}\.\d{2}\.\d{2})?$/i, async (ctx) => {
        botStatsManager.commandUse("стата дата");
        stats_chat_range_cmd(ctx);
    });

    groupStats.command("statsall", async (ctx) => {
        ctx.msg.text = "стата вся";
        //@ts-expect-error
        stats_chat(ctx);
    });
    groupStats.hears(/^(!?)(стата|статистика) (день|сьогодні|вся|тиждень|місяць|вчора|рік)/i, stats_chat);

    //@ts-expect-error
    groupStats.command(["me", "i"], async (ctx) => stats_user(ctx, "я"));
    groupStats.hears(/^(!?)(!я|йа|хто я)$/i, async (ctx) => {
        botStatsManager.commandUse("я");
        await stats_user(ctx, "я");
    });

    //@ts-expect-error
    groupStats.command("you", stats_user);
    groupStats.hears(/^(!?)(ти|хто ти)/i, async (ctx) => {
        if (
            (!ctx.msg.reply_to_message && !ctx.msg?.text?.startsWith("!ти ")) ||
            (ctx.msg.reply_to_message && !["!ти", "хто ти"].includes(ctx.msg?.text || ""))
        ) {
            return;
        }
        botStatsManager.commandUse("ти");
        await stats_user(ctx, "ти");
    });

    //@ts-expect-error
    group.command("nick", set_nickname);
    group.hears(/^(\+(нік|нікнейм))/i, async (ctx) => {
        botStatsManager.commandUse("нік");
        await set_nickname(ctx);
    });

    group.hears(/^-(нік|нікнейм)/i, async (ctx) => {
        botStatsManager.commandUse("нік");
        del_nickname(ctx);
    });

    groupStats.hears(/^!(інактив|неактив)/i, async (ctx) => {
        botStatsManager.commandUse("інактив");
        chatInactive_cmd(ctx);
    });

    group.hears([/^!ссприховати/i, "!фікс вступ"], async (ctx) => {
        botStatsManager.commandUse("ссприховати");
        del_user_active(ctx);
    });

    group.hears(/^!чистка \d+ \d/, async (ctx) => {
        botStatsManager.commandUse("чистка");
        chatCleanup(ctx);
    });

    group.hears(/^!рест/, removeFromChatCleanup);

    // CHARTS
    group.on("edited_message:caption", async (ctx, next) => {
        // TODO: fix types
        if (["!стата фон я", "стата фон я", "/setmybg"].includes(ctx.msg.caption)) {
            // @ts-expect-error
            setChartBg(ctx, "user");
            console.log(ctx);
        } else if (["!стата фон чат", "стата фон чат", "/setchatbg"].includes(ctx.msg.caption)) {
            if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
                // @ts-expect-error
                setChartBg(ctx, "chat");
            }
        }
        return await next();
    });

    group.hears(/(!?)стата фон я/i, (ctx) => {
        setChartBg(ctx, "user");
    });
    group.hears(/^\/setmybg/i, (ctx) => {
        setChartBg(ctx, "user");
    });

    group.hears(/(!?)стата фон чат/i, async (ctx) => {
        if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
            setChartBg(ctx, "chat");
        }
    });
    group.hears(/^\/setchatbg/i, async (ctx) => {
        if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
            setChartBg(ctx, "chat");
        }
    });

    group.hears(/^(!?)стата колір/, async (ctx) => {
        await setChartColor(ctx);
    });

    group.command("settings", chatSettings_cmd);

    bot.command("tchats", statsChatGlobal);

    // group.hears(/^!дата вступу/, (ctx) => {
    //     setUserJoinDate_cmd(ctx);
    // });

    // -------- STAFF COMMANDS --------

    // bot.hears(/^бот(\??)$/i, async (ctx) => botTest_cmd(ctx));

    botAdmin.hears("!ssstats", bot_stats_cmd);

    botAdmin.hears("!ssreset stats", botStatsManager.resetAll);

    botAdmin.hears("!ssreset msg", botStatsManager.resetMessages);

    botAdmin.hears("!ssgc", collectGarbage);

    botAdmin.hears(/^!ssleave/, leaveChat_cmd);

    botAdmin.hears(/^!ssadmins/, getChatAdmins_cmd);

    botAdmin.hears(/^!ssinvite/, getChatInvite_cmd);

    botAdmin.hears(/^!ssru/, (ctx) => {
        const wantedUser = parseCmdArgs(ctx.msg?.text ?? ctx.msg?.caption)[0];
        if (wantedUser) {
            ctx.reply(String(getUserId(wantedUser, ctx.chat.id)));
        }
    });

    botAdmin.hears("!ssbroadcast_owners", broadcast_owners_cmd);

    botAdmin.hears(/^!ssbroadcast_chats/, broadcast_chats_cmd);

    botAdmin.hears("!ssmem", botMemoryUsage);

    botAdmin.hears(/^!ssrc/, removeChatData_cmd);

    botAdmin.hears("!ssclearactive", clearOldBotActive);

    botAdmin.hears(/^!sscga/, clearGroupActive);

    // Etc.

    group.hears("/getid", getId_cmd);

    botAdmin.hears("!sdel", delMessage);

    botAdmin.hears("!hello", hello);

    group.hears("!sban", ban_cmd);

    botAdmin.hears(/^!sscanh/, scanChatHistory_cmd);

    botAdmin.hears("!toggleCharts", toggleCharts);

    botAdmin.hears(/^!loglvl/i, setLogLvl);

    botAdmin.hears(/^!ssadv/, async (ctx) => await broadcast_adv(ctx));
    bot.filter((ctx) => !!(ctx.msg?.caption ?? ctx.msg?.text)?.startsWith("!ssadv")).on("edited_message", (ctx) => {
        if ((ctx.msg.caption || ctx.msg.text)?.startsWith("!ssadvt")) {
            // @ts-expect-error
            broadcast_adv(ctx);
        } else {
            // @ts-expect-error
            broadcast_adv(ctx, false);
        }
    });

    botAdmin
        .filter((ctx) => !!ctx.msg?.reply_to_message)
        .on(":text")
        .hears([/^!ssr /, /^!sbr /], async (ctx) => react_cmd(ctx));

    botAdmin.hears(/^!ssuo/, unban_owners_cmd);

    botAdmin.hears(/^!ssrban/, remote_ban_cmd);

    botAdmin.hears(/^!ssblid/, addToBlacklist);

    botAdmin.hears("!ssuci", updateDbChatsInfo);

    botAdmin.hears(/^!sse/, async (ctx) => {
        if (ctx.msg.reply_to_message) {
            ctx.reply((ctx.msg.text ?? ctx.msg.caption).replace(/^!sse /, ""), {
                reply_parameters: { message_id: ctx.msg.reply_to_message.message_id },
            });
        }
    });

    // MUST BE THE LAST ONE
    bot.on("message", async (ctx) => {
        memes(ctx);
    });
}
export default regCommands;
