import formattedDate from "../utils/date";
import { active } from "../data/active";
import { type Context, type NextFunction } from "grammy";
import cfg from "../config";

function ActiveCollectorWrapper() {
  return async function activeCollector(ctx: Context, next: NextFunction) {
    if (
      !ctx.from ||
      !ctx.chat ||
      ctx.from.is_bot ||
      ctx.chat.id === ctx.from.id ||
      ctx.msg?.reply_to_message?.is_automatic_forward ||
      ctx.chatMember ||
      ctx.msg?.left_chat_member ||
      cfg.IGNORE_IDS.includes(ctx.from.id) // anonimous users
    ) {
      return await next();
    } else {
      const chat_id = ctx.chat.id;
      const user_id = ctx.from.id;
      active.data[chat_id] ??= {};

      const today = formattedDate.today[0];
      if (active.data[chat_id]?.[user_id] === undefined) {
        active.data[chat_id]![user_id] = new UserActive(
          today,
          today,
          ctx.from.first_name,
          "",
          ctx.from.username || ""
        );
      } else {
        active.data[chat_id]![user_id]!.active_last = today;
        active.data[chat_id]![user_id]!.name = ctx.from.first_name
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/&/g, "&amp");
        active.data[chat_id]![user_id]!.username = ctx.from.username || "";
      }
    }

    return await next();
  };
}

class UserActive {
  active_first = "";
  active_last = "";
  name = "";
  nickname = "";
  username = "";
  constructor(
    active_first: string,
    active_last: string,
    name: string,
    nickname: string,
    username: string
  ) {
    this.active_first = active_first;
    this.active_last = active_last;
    this.name = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    this.nickname = nickname;
    this.username = username;
  }
}

export default ActiveCollectorWrapper;
