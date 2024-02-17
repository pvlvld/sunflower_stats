import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function del_nickname(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  active: YAMLWrapper<IActive>
) {
  //@ts-expect-error
  active.data[ctx.chat.id][ctx.from.id].nickname = undefined;
  ctx.reply(`✅ Нікнейм успішно видалено.`, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}

export default del_nickname;
