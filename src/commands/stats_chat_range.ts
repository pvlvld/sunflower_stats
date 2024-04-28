import type { ChatTypeContext, HearsContext } from "grammy";
import type { MyContext } from "../types/context";
import DbStats from "../db/stats";
import parseCmdArgs from "../utils/parseCmdArgs";
import isValidNumbers from "../utils/isValidNumbers";
import { getStatsRatingPlusToday } from "../utils/getStatsRating";

async function stats_chat_range_cmd(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  validateDate = true
) {
  const dateRange = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption) as string[];

  if (dateRange.length > 2 || (validateDate && !isValidDateRange(dateRange))) {
    return void (await ctx.reply(
      'Команда має мати такий формат:\n"стата 2022.04.13" або стата "2022.04.13 2022.04.14"'
    ));
  }

  if (dateRange.length === 2) {
    return void (await ctx.reply(
      `📊 Статистика чату за ${dateRange[0]} - ${dateRange[1]}:\n\n` +
        getStatsRatingPlusToday(
          await DbStats.chat.inRage(ctx.chat.id, [dateRange[0], dateRange[1]]),
          ctx.chat.id
        ),
      {
        disable_notification: true,
        link_preview_options: { is_disabled: true },
      }
    ));
  }

  return void (await ctx.reply(
    `📊 Статистика чату за ${dateRange[0]}:\n\n` +
      getStatsRatingPlusToday(await DbStats.chat.date(ctx.chat.id, dateRange[0]), ctx.chat.id),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  ));
}

function isValidDateRange(dateRange: string[]) {
  if (dateRange.length === 1) {
    return (
      dateRange[0].length === 10 &&
      dateRange[0].split(".").length === 3 &&
      isValidNumbers(dateRange[0].split("."))
    );
  }
  return (
    dateRange[0].length === 10 &&
    dateRange[1].length === 10 &&
    dateRange[0].split(".").length === 3 &&
    dateRange[1].split(".").length === 3 &&
    isValidNumbers(dateRange[0].split(".")) &&
    isValidNumbers(dateRange[1].split("."))
  );
}

export default stats_chat_range_cmd;
