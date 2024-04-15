import getUserId from "../utils/getUserId";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import type DbStats from "../db/stats";
import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import { active } from "../data/active";

async function stats_their(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats
) {
  const userId =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(4), ctx.chat.id, active) ||
    -1;

  if ([136817688, 777000, -1].includes(userId) || ctx.msg.reply_to_message?.from?.is_bot) {
    await ctx.reply("Користувача не знайдено.");
    return;
  }

  await ctx.reply(
    getUserStatsMessage(ctx.chat.id, userId, await dbStats.user.all(ctx.chat.id, userId), active),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_their;
