import { botStatsManager } from "../commands/botStats";
import { type Context, type NextFunction } from "grammy";
import { DBStats } from "../db/stats";

export function StatsCollectorWrapper() {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    botStatsManager.newMessage();
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      ctx.msg?.reply_to_message?.is_automatic_forward ||
      ctx.msg?.new_chat_members ||
      [136817688, 777000].includes(ctx.from.id) // anonimous users
    ) {
      return await next();
    } else {
      DBStats.user.countUserMessage(ctx.chat.id, ctx.from.id);
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
