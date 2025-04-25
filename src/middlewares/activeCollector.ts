import { type Context, type NextFunction } from "grammy";
import formattedDate from "../utils/date.js";
import { active } from "../redis/active.js";
import cfg from "../config.js";

function ActiveCollectorWrapper() {
    let _chatId = 0;
    let _userId = 0;

    return async function activeCollector(ctx: Context, next: NextFunction) {
        if (cfg.GET_STATUS() === "stopping") return;
        if (
            !ctx.from ||
            !ctx.chat ||
            ctx.from.is_bot ||
            ctx.chat.id === ctx.from.id ||
            ctx.chatMember ||
            ctx.msg?.left_chat_member ||
            cfg.IGNORE_IDS.indexOf(ctx.from.id) !== -1 // anonimous users
        ) {
            return await next();
        } else {
            _chatId = ctx.chat.id;
            _userId = ctx.from.id;

            active.upsertUser(
                _chatId,
                _userId,
                "",
                formattedDate.today[0],
                ctx.from.first_name,
                "",
                ctx.from.username || ""
            );
        }

        return await next();
    };
}

// - Legacy
// class UserActive {
//     active_first = "";
//     active_last = "";
//     name = "";
//     nickname = "";
//     username = "";
//     constructor(active_first: string, active_last: string, name: string, nickname: string, username: string) {
//         this.active_first = active_first;
//         this.active_last = active_last;
//         this.name = Escape.html(name);
//         this.nickname = nickname;
//         this.username = username;
//     }
// }

export default ActiveCollectorWrapper;
