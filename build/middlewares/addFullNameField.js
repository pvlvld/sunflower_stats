"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFullNameField = void 0;
async function addFullNameField(ctx, next) {
    if (ctx.from) {
        ctx.from.full_name = `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim();
    }
    await next();
}
exports.addFullNameField = addFullNameField;
