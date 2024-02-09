import { type Context, type NextFunction } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { FormattedDate } from "../utils/date";

function ActiveCollectorWrapper(
  active: YAMLWrapper<IActive>,
  formattedDate: FormattedDate
) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    if (!ctx.from || !ctx.chat || ctx.from.is_bot) {
      return await next();
    } else {
      active.data[ctx.chat.id] ??= {};

      if (active.data[ctx.chat.id]?.[ctx.from.id] === undefined) {
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id] = {
          active_last: formattedDate.today,
          active_first: formattedDate.today,
          name: ctx.from.first_name,
          username: ctx.from.username,
        };
      } else {
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id].active_last = formattedDate.today;
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id].name = ctx.from.first_name;
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id].username = ctx.from.username;
      }
    }

    return await next();
  };
}

export default ActiveCollectorWrapper;
