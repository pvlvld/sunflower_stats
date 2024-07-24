import { messagesStatsBatchStore } from "../data/messagesStatsBatchStore.js";
import { botStatsManager } from "../commands/botStats.js";
import type { Context, NextFunction } from "grammy";
import cfg from "../config.js";

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
      // anonimous users
      cfg.IGNORE_IDS.includes(ctx.from.id) ||
      ctx.editedMessage
    ) {
      return await next();
    } else {
      messagesStatsBatchStore.count(ctx.chat.id, ctx.from.id);
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
