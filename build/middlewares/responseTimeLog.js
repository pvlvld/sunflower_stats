"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTimeLog = void 0;
const big_js_1 = __importDefault(require("big.js"));
async function responseTimeLog(ctx, next) {
    const start = String(process.hrtime.bigint());
    await next();
    const ms = new big_js_1.default(String(process.hrtime.bigint())).minus(start).div(1000000);
    console.log(`Response time: ${ms.toString()} ms`);
}
exports.responseTimeLog = responseTimeLog;
