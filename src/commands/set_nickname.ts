import parseCmdArgs from "../utils/parseCmdArgs";
import type { IGroupTextContext } from "../types/context";
import { active } from "../data/active";

async function set_nickname(ctx: IGroupTextContext) {
  if (!active.data[ctx.chat.id]![ctx.from.id]) {
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

  active.data[ctx.chat.id]![ctx.from.id]!.nickname = nickname;
  await ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}
export default set_nickname;
