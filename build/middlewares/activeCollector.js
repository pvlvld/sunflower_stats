"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ActiveCollectorWrapper(active, formattedDate) {
    return async function statsCollector(ctx, next) {
        if (!ctx.from ||
            !ctx.chat ||
            ctx.from.is_bot ||
            ctx.chat.id === ctx.from.id ||
            !!ctx.msg?.reply_to_message?.is_automatic_forward) {
            return await next();
        }
        else {
            active.data[ctx.chat.id] ??= {};
            if (active.data[ctx.chat.id]?.[ctx.from.id] === undefined) {
                active.data[ctx.chat.id][ctx.from.id] = {
                    active_last: formattedDate.today,
                    active_first: formattedDate.today,
                    name: ctx.from.first_name,
                    username: ctx.from.username,
                };
            }
            else {
                active.data[ctx.chat.id][ctx.from.id].active_last = formattedDate.today;
                active.data[ctx.chat.id][ctx.from.id].name = ctx.from.first_name;
                active.data[ctx.chat.id][ctx.from.id].username = ctx.from.username;
            }
        }
        return await next();
    };
}
exports.default = ActiveCollectorWrapper;
