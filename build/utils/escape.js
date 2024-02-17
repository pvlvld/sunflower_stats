"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Escape = {
    markdownV1: escapeMarkdownV1,
    markdownV2: escapeMarkdownV2,
};
function escapeMarkdownV2(str) {
    return str.replace(/([-_.!|>()+#=*~{}`[\]\\])/g, "\\$1");
}
function escapeMarkdownV1(str) {
    return str.replace(/([_*`[])/g, "\\$1");
}
exports.default = Escape;
