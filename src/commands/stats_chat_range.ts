import type { IGroupTextContext } from "../types/context";
import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";
import parseCmdArgs from "../utils/parseCmdArgs";
import { DBStats } from "../db/stats";
import { isValidDateOrDateRange } from "../utils/isValidDateOrDateRange";

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
          `📊 Статистика чату за ${dateRange[0]} - ${dateRange[1]}:\n\n` +
          getStatsRatingPlusToday(
            await DBStats.chat.inRage(chat_id, [dateRange[0], dateRange[1]]),
            chat_id,
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
        `📊 Статистика чату за ${dateRange[0]}:\n\n` +
        getStatsRatingPlusToday(await DBStats.chat.date(chat_id, dateRange[0]), chat_id, "text"),
      chart: undefined,
    },
    chatSettings.selfdestructstats
  ));
}

export default stats_chat_range_cmd;
