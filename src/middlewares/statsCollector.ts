import { botStatsManager } from "../commands/botStats";
import type TodayStats from "../data/stats";
import { type Context, type NextFunction } from "grammy";

export function StatsCollectorWrapper(todayStats: TodayStats) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    botStatsManager.newMessage();
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      !!ctx.msg?.reply_to_message?.is_automatic_forward ||
      ctx.msg?.new_chat_members ||
      [136817688, 777000].includes(ctx.from.id) // anonimous users
    ) {
      return await next();
    } else {
      todayStats.data[ctx.chat.id] ??= {};
      //@ts-expect-error
      todayStats.data[ctx.chat.id][ctx.from.id] ??= 0;
      //@ts-expect-error
      todayStats.data[ctx.chat.id][ctx.from.id] += 1;
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
