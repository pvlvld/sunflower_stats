import type { IGroupTextContext } from "../types/context";
import { active } from "../data/active";

async function del_nickname(ctx: IGroupTextContext) {
  try {
    active.data[ctx.chat.id]![ctx.from.id]!.nickname = null;
    await ctx.reply(`✅ Нікнейм успішно видалено.`, {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    });
  } catch (e) {}
}

export default del_nickname;
