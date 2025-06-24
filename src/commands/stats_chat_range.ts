import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import { isValidDateOrDateRange } from "../utils/isValidDateOrDateRange.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { getStatsChatRating } from "../utils/getStatsRating.js";
import type { IGroupTextContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { DBStats } from "../db/stats.js";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";
import Escape from "../utils/escape.js";
import { active } from "../redis/active.js";

async function stats_chat_range_cmd(ctx: IGroupTextContext, validateDate = true) {
    const dateRange = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption) as string[];

    if (dateRange.length > 2 || (validateDate && !isValidDateOrDateRange(dateRange))) {
        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text: ctx.t("stats-date-help"),
                chart: undefined,
            },
            true
        ));
    }
    const chat_id = ctx.chat.id;

    if (dateRange.length === 2) {
        const [stats, chatSettings, activeUsers] = await Promise.all([
            DBStats.chat.inRage(chat_id, [dateRange[0], dateRange[1]]),
            getCachedOrDBChatSettings(chat_id),
            active.getChatUsers(chat_id),
        ]);

        if (stats.length === 0) {
            return void (await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: ctx.t("stats-empty-date"),
                    chart: undefined,
                },
                true
            ));
        }

        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text:
                    `📊 Статистика${await getPremiumMarkSpaced(chat_id)}«${Escape.html(ctx.chat.title)}» за ${
                        dateRange[0]
                    } - ${dateRange[1]}:\n\n` +
                    (await getStatsChatRating(ctx, stats, activeUsers, chatSettings, 1, "date", "text")),
                chart: undefined,
            },
            chatSettings.selfdestructstats
        ));
    } else {
        const [stats, chatSettings, activeUsers] = await Promise.all([
            DBStats.chat.date(chat_id, dateRange[0]),
            getCachedOrDBChatSettings(chat_id),
            active.getChatUsers(chat_id),
        ]);

        if (stats.length === 0) {
            return void (await sendSelfdestructMessage(
                ctx,
                {
                    isChart: false,
                    text: ctx.t("stats-empty-date"),
                    chart: undefined,
                },
                true
            ));
        }

        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text:
                    `📊 Статистика${await getPremiumMarkSpaced(chat_id)}«${Escape.html(ctx.chat.title)}» за ${
                        dateRange[0]
                    }:\n\n` + (await getStatsChatRating(ctx, stats, activeUsers, chatSettings, 1, "date", "text")),
                chart: undefined,
            },
            chatSettings.selfdestructstats
        ));
    }
}

export default stats_chat_range_cmd;
