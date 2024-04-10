import type { IGroupHearsCommandContext } from "../types";
import cfg from "../config";
import cacheManager from "./cache";

function isChatOwner(ctx: IGroupHearsCommandContext) {
  return (
    (ctx.from?.id !== undefined &&
      ctx.from.id === cacheManager.TTLCache.get(`owner_${ctx.chat.id}`)) ||
    cfg.ADMINS.includes(ctx.from.id)
  );
}

export default isChatOwner;
