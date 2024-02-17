import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function add_nickname(
    ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
    active: YAMLWrapper<IActive>
) {
    const result = ctx.message?.text?.match(/^((\+нік|\+нікнейм) ((.*)))$/i);
    console.log(result);
    const nickname = result?.[3];
    //@ts-expect-error
    active.data[ctx.chat.id][ctx.from.id].nickname = nickname;
    ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
        parse_mode: "MarkdownV2",
        disable_notification: true,
        link_preview_options: { is_disabled: true },
    });
}
export default add_nickname;