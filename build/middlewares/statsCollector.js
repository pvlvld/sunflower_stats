"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsCollectorWrapper = void 0;
function StatsCollectorWrapper(yamlStats) {
    return async function statsCollector(ctx, next) {
        if (!ctx.chat ||
            ctx.from?.is_bot ||
            ctx.chat.id === ctx.from?.id ||
            !!ctx.msg?.reply_to_message?.is_automatic_forward) {
            return await next();
        }
        else {
            yamlStats.data[ctx.chat.id] ??= {};
            yamlStats.data[ctx.chat.id][ctx.from.id] ??= 1;
            yamlStats.data[ctx.chat.id][ctx.from.id] += 1;
        }
        return await next();
    };
}
exports.StatsCollectorWrapper = StatsCollectorWrapper;
exports.default = StatsCollectorWrapper;
