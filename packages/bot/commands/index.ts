import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { setUserJoinDate_cmd } from "./staff/setUserJoinDate.js";
import { scanChatHistory_cmd } from "./staff/scanChatHistory.js";
import bot_stats_cmd, { botStatsManager } from "./botStats.js";
import broadcast_owners_cmd from "./staff/broadcast_owners.js";
import removeFromChatCleanup from "./removeFromChatCleanup.js";
import { removeChatData_cmd } from "./staff/removeChatData.js";
import broadcast_chats_cmd from "./staff/broadcast_chats.js";
import { donate_cmd, refreshDonate_cmd } from "./donate.js";
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
import { delMessage } from "./staff/del.js";
import leaveChat_cmd from "./leaveChat.js";
import { setChartBg } from "./chartBg.js";
import { ban_cmd } from "./staff/ban.js";
import botTest_cmd from "./botTets.js";
import help_cmd from "./help.js";
import cfg from "../config.js";
import memes from "./memes.js";
import bot from "../bot.js";
import { unban_owners_cmd } from "./staff/unban_owners.js";
import { remote_ban_cmd } from "./staff/remote_ban.js";
import { addToBlacklist } from "./staff/blacklist.js";
import { start_cmd } from "./start.js";
import { updateDbChatsInfo } from "./staff/updateDbChatsInfo.js";
import { changeLocaleCommand } from "./changeLocale.js";
import { updateBotLocalization } from "./staff/updateBotLocalization.js";
import { pinMessage } from "./staff/pinMessage.js";
import { peakDays } from "./peakDays.js";
import { updateActive_command } from "./updateActive.js";
import { setPremium_command } from "./staff/setPremium.js";
import { rescanChatHistory_command } from "./rescanChatHistory.js";
import { oldUsers } from "./old.js";
import { active } from "../redis/active.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { GrammyError } from "grammy";
import { StatsService } from "../chart/getStatsChart.js";

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

    bot.command(["locale", "language", "lang"], async (ctx) => {
        botStatsManager.commandUse("locale");
        changeLocaleCommand(ctx);
    });

    dm.command(["me", "i"], async (ctx) => {
        await StatsService.getInstance().userStatsGlobalCallback(ctx);
    });

    bot.command("donate", donate_cmd);

    groupStats.command("w", async (ctx) => {
        ctx.msg.text = "стата тиждень";
        await StatsService.getInstance().chatStatsCallback(ctx);
    });
    groupStats.command("m", async (ctx) => {
        ctx.msg.text = "стата місяць";
        await StatsService.getInstance().chatStatsCallback(ctx);
    });
    groupStats.command("y", async (ctx) => {
        ctx.msg.text = "стата рік";
        await StatsService.getInstance().chatStatsCallback(ctx);
    });

    bot.command("refreshDonate", refreshDonate_cmd);
    bot.command(["start", "about"], start_cmd);
    group.command(["help"], async (ctx) => {
        botStatsManager.commandUse("help");
        help_cmd(ctx);
    });

    // STATS

    groupStats.hears(
        /^(!|\/)?(стата|статистика|stats)(@[a-zA-Z_]+)? \d{4}(\.|-)\d{2}(\.|-)\d{2}( \d{4}(\.|-)\d{2}(\.|-)\d{2})?$/i,
        async (ctx) => {
            botStatsManager.commandUse("стата дата");
            await StatsService.getInstance().chatStatsCallback(ctx);
        }
    );

    groupStats.command("stats", async (ctx) => await StatsService.getInstance().chatStatsCallback(ctx));
    groupStats.hears(/^(стата|статистика)$/i, async (ctx) => await StatsService.getInstance().chatStatsCallback(ctx));

    groupStats.command("statsall", async (ctx) => {
        ctx.msg.text = "стата вся";
        await StatsService.getInstance().chatStatsCallback(ctx);
    });
    groupStats.hears(
        /^(!?)(стата|статистика) (день|сьогодні|вся|тиждень|місяць|вчора|рік)/i,
        async (ctx) => await StatsService.getInstance().chatStatsCallback(ctx)
    );

    groupStats.command(["me", "i"], async (ctx) => await StatsService.getInstance().userStatsCallback(ctx, true));
    groupStats.hears(
        /^(!?)(!я|йа|хто я)$/i,
        async (ctx) => await StatsService.getInstance().userStatsCallback(ctx, true)
    );

    groupStats.command("you", async (ctx) => await StatsService.getInstance().userStatsCallback(ctx, false));
    groupStats.hears(/^(!?)(ти|хто ти)/i, async (ctx) => await StatsService.getInstance().userStatsCallback(ctx, false));

    group.command("nick", set_nickname);
    group.hears(/^(\+(нік|нікнейм))/i, async (ctx) => {
        botStatsManager.commandUse("нік");
        await set_nickname(ctx);
    });

    group.hears(/^-(нік|нікнейм)/i, async (ctx) => {
        botStatsManager.commandUse("нік");
        del_nickname(ctx);
    });

    groupStats.command("inactive", async (ctx) => {
        botStatsManager.commandUse("інактив");
        chatInactive_cmd(ctx);
    });

    groupStats.hears(/^!(інактив|неактив)/i, async (ctx) => {
        botStatsManager.commandUse("інактив");
        chatInactive_cmd(ctx);
    });

    group.hears([/^!ссприховати/i, "!фікс вступ"], async (ctx) => {
        botStatsManager.commandUse("ссприховати");
        del_user_active(ctx);
    });

    group.command("peakdays", peakDays);

    group.hears(/^!чистка \d+ \d/, async (ctx) => {
        botStatsManager.commandUse("чистка");
        chatCleanup(ctx);
    });

    group.hears(/^!рест/, removeFromChatCleanup);

    // CHARTS
    group.on("edited_message:caption", async (ctx, next) => {
        // TODO: fix types
        if (/^((!)?стата фон я|\/setmybg)/.test(ctx.msg.caption)) {
            // @ts-expect-error
            setChartBg(ctx, "user");
            console.log(ctx);
        } else if (/^((!)?стата фон чат|\/setchatbg)/.test(ctx.msg.caption)) {
            if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
                // @ts-expect-error
                setChartBg(ctx, "chat");
            }
        }
        return await next();
    });

    group.hears(/^((!?)(стата фон я|\/setmybg))/i, (ctx) => {
        setChartBg(ctx, "user");
    });

    group.hears(/^((!?)(стата фон чат|\/setchatbg))/i, async (ctx) => {
        if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
            setChartBg(ctx, "chat");
        }
    });

    group.command("rescan", async (ctx) => {
        await rescanChatHistory_command(ctx);
    });

    group.hears(/^(!?)стата колір/, async (ctx) => {
        await setChartColor(ctx);
    });

    group.command("settings", chatSettings_cmd);

    bot.command("tchats", async (ctx) => await StatsService.getInstance().chatsRatingCallback(ctx));

    group.hears("!updatemembers", async (ctx) => {
        updateActive_command(ctx);
    });

    group.command("old", oldUsers);

    // group.hears(/^!дата вступу/, (ctx) => {
    //     setUserJoinDate_cmd(ctx);
    // });

    // -------- STAFF COMMANDS --------

    // bot.hears(/^бот(\??)$/i, async (ctx) => botTest_cmd(ctx));

    botAdmin.hears("!ssstats", bot_stats_cmd);

    botAdmin.hears("!ssreset stats", botStatsManager.resetAll);

    botAdmin.hears("!ssgc", collectGarbage);

    botAdmin.hears(/^!ssleave/, leaveChat_cmd);

    botAdmin.hears(/^!ssadmins/, getChatAdmins_cmd);

    botAdmin.hears(/^!ssinvite/, getChatInvite_cmd);

    botAdmin.hears(/^!ssru/, async (ctx) => {
        const wantedUser = parseCmdArgs(ctx.msg?.text ?? ctx.msg?.caption)[0];
        if (wantedUser) {
            ctx.reply(String(await getUserId(wantedUser, ctx.chat.id)));
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

    group.hears("!sban", ban_cmd);

    botAdmin.hears(/^\/prem/, setPremium_command);

    botAdmin.hears(/^!sscanh/, scanChatHistory_cmd);

    botAdmin.hears("!toggleCharts", toggleCharts);

    botAdmin.hears(/^!loglvl/i, setLogLvl);

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

    botAdmin.hears("!updateLocale", async (ctx) => {
        updateBotLocalization(ctx);
    });

    botAdmin.hears("!sspin", async (ctx) => {
        pinMessage(ctx);
    });

    botAdmin.hears(/^!listmembers -\d+/, async (ctx) => {
        console.log("List members command received");
        const targetChatId = parseCmdArgs(ctx.msg?.text ?? ctx.msg?.caption)[0]!;
        let membersMsg = "List of members:";

        const chatMembers = await active.getChatUsers(+targetChatId);

        for (const [userId, userData] of Object.entries(chatMembers)) {
            membersMsg += `\n${await getUserNameLink.html(userData.name, userData.username, userId)}`;
        }

        await ctx.reply(membersMsg).catch((e) => {
            if (e instanceof GrammyError && e.description.includes("too long")) {
                ctx.reply("The list is too long to send in one message. Check the logs for details.").catch((e) => {});
                console.log(`Members list for chat ${targetChatId}:`, membersMsg);
            } else {
                ctx.reply("Failed to send members list. Check the logs for details.").catch((e) => {});
                console.error("Failed to send members list:", e);
            }
        });
    });

    // MUST BE THE LAST ONE
    bot.on("message", async (ctx) => {
        memes(ctx);
    });
}
export default regCommands;
