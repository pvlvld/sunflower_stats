import { getUserFirstStatsDate } from "../utils/getUserFirstStatsDate.js";
import { type Context, type NextFunction } from "grammy";
import formattedDate from "../utils/date.js";
import { active } from "../data/active.js";
import Escape from "../utils/escape.js";
import cfg from "../config.js";

function ActiveCollectorWrapper() {
    let _chatId = 0;
    let _userId = 0;

    return async function activeCollector(ctx: Context, next: NextFunction) {
        if (cfg.BOT_STATUS === "stopping") return;
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
            active.data[_chatId] ??= {};

            const today = formattedDate.today[0];
            if (active.data[_chatId]![_userId] === undefined) {
                let active_first = (await getUserFirstStatsDate(_chatId, _userId)) || today;

                active_first ??= today;
                active.data[_chatId]![_userId] = new UserActive(
                    active_first,
                    today,
                    ctx.from.first_name,
                    "",
                    ctx.from.username || ""
                );
            } else {
                active.data[_chatId]![_userId]!.active_last = today;
                active.data[_chatId]![_userId]!.name = Escape.html(ctx.from.first_name);
                active.data[_chatId]![_userId]!.username = ctx.from.username || "";
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
    constructor(active_first: string, active_last: string, name: string, nickname: string, username: string) {
        this.active_first = active_first;
        this.active_last = active_last;
        this.name = Escape.html(name);
        this.nickname = nickname;
        this.username = username;
    }
}

export default ActiveCollectorWrapper;
