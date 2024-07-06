import type { IGroupTextContext } from "../types/context.js";
import { active } from "../data/active.js";

async function del_nickname(ctx: IGroupTextContext) {
  if (active.data[ctx.chat.id]![ctx.from.id]) {
    active.data[ctx.chat.id]![ctx.from.id]!.nickname = "";
  }
  await ctx
    .reply(`✅ Нікнейм успішно видалено.`, {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    })
    .catch((e) => {});
}

export default del_nickname;
