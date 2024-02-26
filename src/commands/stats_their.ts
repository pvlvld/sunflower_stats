import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import DbStats from "../db/stats";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import getUserId from "../utils/getUserId";
import parseCmdArgs from "../utils/parseCmdArgs";

async function stats_their(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  const userId =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId(
      parseCmdArgs(ctx.msg.text ?? ctx.msg.caption)[0],
      ctx.chat.id,
      active
    ) ||
    -1;

  if (userId === -1) {
    await ctx.reply("Користувача не знайдено.");
    return;
  }

  await ctx.reply(
    getUserStatsMessage(
      ctx.chat.id,
      userId,
      await dbStats.user.all(ctx.chat.id, userId),
      todayStats,
      active
    ),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_their;
