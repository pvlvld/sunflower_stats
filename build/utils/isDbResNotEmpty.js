"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDbResNotEmpty(res) {
    return Array.isArray(res) && res.length > 0;
}
exports.default = isDbResNotEmpty;
