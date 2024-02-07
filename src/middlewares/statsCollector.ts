import { type Context, type NextFunction } from "grammy";
import YAMLStats from "../data/stats";

export function StatsCollectorWrapper(yamlStats: YAMLStats) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    if (!ctx.from || !ctx.chat || ctx.from.is_bot) {
      return await next();
    } else {
      if (!yamlStats.data[ctx.chat.id]) {
        yamlStats.data[ctx.chat.id] = {};
      }

      if (!yamlStats.data[ctx.chat.id]?.[ctx.from.id]) {
        //@ts-ignore
        yamlStats.data[ctx.chat.id][ctx.from.id] = {
          name: ctx.from.first_name,
          username: ctx.from.username,
          messages: 1,
        };
      } else {
        //@ts-ignore
        yamlStats.data[ctx.chat.id][ctx.from.id].messages += 1;
      }
    }

    return await next();
  };
}

export default StatsCollectorWrapper;
