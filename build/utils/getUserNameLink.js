"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = __importDefault(require("./escape"));
const getUserNameLink = {
    markdown: (name, username, user_id) => {
        return `[${escape_1.default.markdownV1(name)}](${username && username !== "null"
            ? `https://${username}.t.me`
            : `tg://user?id=${user_id}`})`;
    },
    html: () => { },
};
exports.default = getUserNameLink;
