import { type Context, type NextFunction } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { FormattedDate } from "../utils/date";

function ActiveCollectorWrapper(
  active: YAMLWrapper<IActive>,
  formattedDate: FormattedDate
) {
  return async function statsCollector(ctx: Context, next: NextFunction) {
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      !!ctx.msg?.reply_to_message?.is_automatic_forward ||
      ctx.msg?.new_chat_members
    ) {
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
        active.data[ctx.chat.id][ctx.from.id].name = ctx.from.first_name
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/[̩͟͞]/g, "");
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id].username = ctx.from.username;
      }
    }

    return await next();
  };
}

export default ActiveCollectorWrapper;
