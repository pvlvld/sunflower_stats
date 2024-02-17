"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = __importDefault(require("../bot"));
const leaveChatMember_1 = __importDefault(require("./leaveChatMember"));
function regHandlers(active, yamlStats) {
    bot_1.default.on(":left_chat_member", (ctx) => {
        (0, leaveChatMember_1.default)(ctx, yamlStats, active);
    });
}
exports.default = regHandlers;
