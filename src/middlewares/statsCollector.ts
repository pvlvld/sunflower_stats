import { type Context, type NextFunction } from "grammy";
import YAMLStats from "../data/stats";

export function StatsCollectorWrapper(yamlStats: YAMLStats) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id
    ) {
      return await next();
    } else {
      yamlStats.data[ctx.chat.id] ??= {};
      //@ts-expect-error
      yamlStats.data[ctx.chat.id][ctx.from.id] ??= 1;
      //@ts-expect-error
      yamlStats.data[ctx.chat.id][ctx.from.id] += 1;
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
