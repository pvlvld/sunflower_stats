import { active } from "../data/active";
import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";

async function del_nickname(ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>) {
  try {
    active.data[ctx.chat.id]![ctx.from.id]!.nickname = undefined;
    await ctx.reply(`✅ Нікнейм успішно видалено.`, {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    });
  } catch (e) {}
}

export default del_nickname;
