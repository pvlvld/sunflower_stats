import type { MyContext } from "../types/context";
import { type ChatTypeContext, type HearsContext } from "grammy";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import parseCmdArgs from "../utils/parseCmdArgs";

async function add_nickname(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  active: YAMLWrapper<IActive>
) {
  const nickname = parseCmdArgs(ctx.msg.text as string).join(" ");
  if (nickname.length > 20) {
    ctx.reply("Максимальна довжина нікнейму 20 символів.");
    return;
  }

  //@ts-expect-error
  active.data[ctx.chat.id][ctx.from.id].nickname = nickname;
  ctx.reply(`✅ Успішно встановлено нікнейм: ${nickname}`, {
    disable_notification: true,
    link_preview_options: { is_disabled: true },
  });
}
export default add_nickname;
