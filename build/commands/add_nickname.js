"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function add_nickname(ctx, active) {
    const result = ctx.message?.text?.match(/^((\+нік|\+нікнейм) ((.*)))$/i);
    console.log(result);
    const nickname = result?.[3];
    active.data[ctx.chat.id][ctx.from.id].nickname = nickname;
    ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
exports.default = add_nickname;
