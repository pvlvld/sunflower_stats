"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseCmdArgs(command) {
    return command.split(/\s+/).slice(1);
}
exports.default = parseCmdArgs;
