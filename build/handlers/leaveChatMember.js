"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function leaveChatMemberHandler(ctx, yamlStats, active) {
    delete active.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
    delete yamlStats.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
}
exports.default = leaveChatMemberHandler;
