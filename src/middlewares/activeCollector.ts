import { FormattedDate } from "../utils/date";
import { active } from "../data/active";
import { type Context, type NextFunction } from "grammy";

function ActiveCollectorWrapper(formattedDate: FormattedDate) {
  return async function activeCollector(ctx: Context, next: NextFunction) {
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      !!ctx.msg?.reply_to_message?.is_automatic_forward ||
      ctx.msg?.new_chat_members ||
      [136817688, 777000].includes(ctx.from.id) // anonimous users
    ) {
      return await next();
    } else {
      active.data[ctx.chat.id] ??= {};

      if (active.data[ctx.chat.id]?.[ctx.from.id] === undefined) {
        //@ts-expect-error
        active.data[ctx.chat.id][ctx.from.id] = {
          active_last: formattedDate.today,
          active_first: formattedDate.today
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/[̩͟͞]/g, ""),
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
        //@ts-expect-error // gc experiment
        active.data[ctx.chat.id][ctx.from.id].username = ctx.from.username
          ? ctx.from.username + ""
          : undefined;
      }
    }

    return await next();
  };
}

export default ActiveCollectorWrapper;
