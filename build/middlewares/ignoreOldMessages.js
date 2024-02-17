"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoreOldMessages = void 0;
const afterSeconds = 60;
function dateInSeconds() {
    return Math.round(Date.now() / 1000);
}
async function ignoreOldMessages(ctx, next) {
    if (!ctx.msg)
        return await next();
    if (dateInSeconds() - ctx.msg.date < afterSeconds) {
        return await next();
    }
}
exports.ignoreOldMessages = ignoreOldMessages;
