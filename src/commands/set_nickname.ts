import type { IGroupTextContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { active } from "../data/active.js";
import Escape from "../utils/escape.js";

async function set_nickname(ctx: IGroupTextContext) {
  const chat_id = ctx.chat.id;
  const user_id = ctx.from.id;
  if (active.data[chat_id]![user_id] === undefined) {
    return;
  }

  const nickname = parseCmdArgs(ctx.msg.text as string).join(" ");
  if (nickname.length === 0) {
    await ctx.reply(
      "+нік Х, +нікнейм Х — замість х бажаний нікнейм. Відображається замість імені у всіх командах"
    );
    return;
  }

  if (nickname.length > 20) {
    await ctx.reply("Максимальна довжина нікнейму 20 символів.");
    return;
  }

  active.data[chat_id]![user_id]!.nickname = Escape.html(nickname);
  await ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}
export default set_nickname;
