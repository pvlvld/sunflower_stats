import type { IGroupContext, IGroupHearsCommandContext } from "../types";
import type { CallbackQueryContext, InlineQueryContext } from "grammy";
import cfg from "../config";
import cacheManager from "./cache";

async function isChatOwner(
  ctx:
    | IGroupHearsCommandContext
    | CallbackQueryContext<IGroupContext>
    | InlineQueryContext<IGroupContext>
): Promise<boolean> {
  if (cfg.ADMINS.includes(ctx.from.id)) {
    return true;
  }

  const cachedOwner = cacheManager.LRUCache.get(getCacheKey(ctx.chat.id));

  if (cachedOwner) {
    return ctx.from.id === cachedOwner;
  }

  const admins = await ctx.getChatAdministrators().catch((e) => {});
  if (!admins) {
    return false;
  }

  for (let admin of admins) {
    if (admin.status === "creator") {
      cacheManager.LRUCache.set(getCacheKey(ctx.chat.id), admin.user.id);
      return admin.user.id === ctx.from.id;
    }
  }

  // In case there is no chat owner
  // just to minimize API requests
  cacheManager.LRUCache.set(getCacheKey(ctx.chat.id), -1);

  return false;
}

function getCacheKey(id: number) {
  return `owner_${id}`;
}

export default isChatOwner;
