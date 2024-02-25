import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import DbStats from "../db/stats";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import getUserStatsMessage from "../utils/getUserStatsMessage";

async function stats_their(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  if (!ctx.msg.reply_to_message?.from || ctx.msg.reply_to_message.from.is_bot) {
    await ctx.reply(
      "Для використання команди, потрібно відповісти нею на повідомлення учасника."
    );
    return;
  }

  await ctx.reply(
    getUserStatsMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.from,
      await dbStats.user.all(ctx.chat.id, ctx.msg.reply_to_message.from.id),
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
