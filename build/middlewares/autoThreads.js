"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoThread = void 0;
const METHODS = new Set([
    "sendMessage",
    "sendPhoto",
    "sendVideo",
    "sendAnimation",
    "sendAudio",
    "sendDocument",
    "sendSticker",
    "sendVideoNote",
    "sendVoice",
    "sendLocation",
    "sendVenue",
    "sendContact",
    "sendPoll",
    "sendDice",
    "sendInvoice",
    "sendGame",
    "sendMediaGroup",
    "copyMessage",
    "forwardMessage ",
]);
function autoThread() {
    return async (ctx, next) => {
        const message_thread_id = ctx.msg?.message_thread_id;
        const is_topic_message = ctx.msg?.is_topic_message || false;
        if (message_thread_id !== undefined && is_topic_message) {
            ctx.api.config.use(async (prev, method, payload, signal) => {
                if (!("message_thread_id" in payload) && METHODS.has(method)) {
                    Object.assign(payload, { message_thread_id });
                }
                return await prev(method, payload, signal);
            });
        }
        await next();
    };
}
exports.autoThread = autoThread;
