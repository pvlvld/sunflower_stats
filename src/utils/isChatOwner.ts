import type { IGroupHearsCommandContext } from "../types";
import cacheManager from "./cache";

function isChatOwner(ctx: IGroupHearsCommandContext) {
  return (
    ctx.from?.id !== undefined && ctx.from.id === cacheManager.TTLCache.get(`owner_${ctx.chat.id}`)
  );
}

export default isChatOwner;
