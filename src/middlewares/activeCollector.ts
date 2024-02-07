import { type Context, type NextFunction } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { FormattedDate } from "../utils/date";

export function ActiveCollectorWrapper(
  active: YAMLWrapper<IActive>,
  formattedDate: FormattedDate
) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    if (!ctx.from || !ctx.chat || ctx.from.is_bot) {
      return await next();
    } else {
      if (!active.data[ctx.chat.id]) {
        active.data[ctx.chat.id] = {};
      }

      if (!active.data[ctx.chat.id]?.[ctx.from.id]) {
        //@ts-ignore
        active.data[ctx.chat.id][ctx.from.id] = {
          last_time: formattedDate.today,
          first_time: formattedDate.today,
          name: ctx.from.first_name,
        };
      } else {
        //@ts-ignore
        active.data[ctx.chat.id][ctx.from.id].last_time = formattedDate.today;
      }
    }

    return await next();
  };
}

export default ActiveCollectorWrapper;
