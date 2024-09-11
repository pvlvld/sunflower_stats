import type { IGroupHearsContext } from "../types/context.js";
import { InlineKeyboard } from "grammy";

type IKeyboard = InlineKeyboard | undefined;

function extractAndMakeKeyboard(
    ctx: IGroupHearsContext,
    text: string
): { isKeyboard: boolean; keyboard: IKeyboard; text: string } | undefined {
    let isKeyboard = false;
    let keyboard: IKeyboard = undefined;

    if (text.includes("+btn ")) {
        isKeyboard = true;
        const text_parts = text.split("\n");
        const raw_btn = text_parts.pop()!;
        text = text_parts.join("\n");

        // Syntax: +btn url text
        const btn_parts = raw_btn.split(" ");
        if (btn_parts.length < 3) {
            return void ctx.reply("Помилка при створенні кнопки.").catch((e) => {});
        }
        void btn_parts.shift();
        const btn_url = btn_parts.shift()!;
        if (!btn_url.startsWith("https://")) {
            return void ctx.reply(`Це не схоже на посилання: ${btn_url}`).catch((e) => {});
        }
        const btn_text = btn_parts.join(" ");
        raw_btn;

        keyboard = new InlineKeyboard().url(btn_text, btn_url);
    }

    return { isKeyboard, keyboard, text };
}

export { extractAndMakeKeyboard, IKeyboard };
