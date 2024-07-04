import { botStatsManager } from "../commands/botStats";
import { type Context, type NextFunction } from "grammy";
import { DBStats } from "../db/stats";
import cfg from "../config";

export function StatsCollectorWrapper() {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    botStatsManager.newMessage();
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      ctx.chatMember ||
      ctx.msg?.left_chat_member ||
      cfg.IGNORE_IDS.includes(ctx.from.id) // anonimous users
    ) {
      return await next();
    } else {
      DBStats.user.countUserMessage(ctx.chat.id, ctx.from.id);
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
