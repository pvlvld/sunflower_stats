import type { IGroupTextContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import Escape from "../utils/escape.js";
import { active } from "../redis/active.js";

async function set_nickname(ctx: IGroupTextContext) {
    const nickname = parseCmdArgs(ctx.msg.text as string).join(" ");

    if (nickname.length === 0) {
        await ctx.reply("+нік Х, +нікнейм Х — замість х бажаний нікнейм. Відображається замість імені у всіх командах");
    } else if (nickname.length > 20) {
        await ctx.reply("Максимальна довжина нікнейму 20 символів.");
    } else {
        active.updateUserField(ctx.chat.id, ctx.from.id, "nickname", Escape.html(nickname));
        await ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
            disable_notification: true,
            link_preview_options: { is_disabled: true },
        });
    }
}
export default set_nickname;
