import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage.js";
import { isValidDateOrDateRange } from "../utils/isValidDateOrDateRange.js";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils.js";
import { getStatsChatRating } from "../utils/getStatsRating.js";
import type { IGroupTextContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { DBStats } from "../db/stats.js";
import { getPremiumMarkSpaced } from "../utils/getPremiumMarkSpaced.js";
import Escape from "../utils/escape.js";

async function stats_chat_range_cmd(ctx: IGroupTextContext, validateDate = true) {
    const dateRange = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption) as string[];

    if (dateRange.length > 2 || (validateDate && !isValidDateOrDateRange(dateRange))) {
        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text: 'Команда має мати такий формат:\n"стата 2022.04.13" або стата "2022.04.13 2022.04.14"',
                chart: undefined,
            },
            true
        ));
    }
    const chat_id = ctx.chat.id;
    const chatSettings = await getCachedOrDBChatSettings(chat_id);

    if (dateRange.length === 2) {
        return void (await sendSelfdestructMessage(
            ctx,
            {
                isChart: false,
                text:
                    `📊 Статистика${await getPremiumMarkSpaced(chat_id)}«${Escape.html(ctx.chat.title)}» за ${
                        dateRange[0]
                    } - ${dateRange[1]}:\n\n` +
                    getStatsChatRating(
                        await DBStats.chat.inRage(chat_id, [dateRange[0], dateRange[1]]),
                        chat_id,
                        chatSettings,
                        1,
                        "date",
                        "text"
                    ),
                chart: undefined,
            },
            chatSettings.selfdestructstats
        ));
    }

    return void (await sendSelfdestructMessage(
        ctx,
        {
            isChart: false,
            text:
                `📊 Статистика${await getPremiumMarkSpaced(chat_id)}«${Escape.html(ctx.chat.title)}» за ${
                    dateRange[0]
                }:\n\n` +
                getStatsChatRating(
                    await DBStats.chat.date(chat_id, dateRange[0]),
                    chat_id,
                    chatSettings,
                    1,
                    "date",
                    "text"
                ),
            chart: undefined,
        },
        chatSettings.selfdestructstats
    ));
}

export default stats_chat_range_cmd;
