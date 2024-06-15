import type { IGroupTextContext } from "../../types/context";
import { isValidDateOrDateRange } from "../../utils/isValidDateOrDateRange";
import parseCmdArgs from "../../utils/parseCmdArgs";
import isChatOwner from "../../utils/isChatOwner";
import getUserId from "../../utils/getUserId";
import { active } from "../../data/active";

async function setUserJoinDate_cmd(ctx: IGroupTextContext) {
  let date = (parseCmdArgs(ctx.msg.text ?? ctx.msg.caption) as string | undefined[])[1];
  const chat_id = ctx.chat.id;
  const target_id = ctx.msg.reply_to_message?.from?.id || ctx.from.id;

  if (!(await isChatOwner(chat_id, ctx.from.id))) {
    return void (await ctx.reply("Ця команда доступна лише власнику чату!"));
  }

  date ??= "";
  date = date.split(".").join("-");

  if (!date || isValidDateOrDateRange([date])) {
    return void (await ctx
      .reply("Щось пішло не так.\nПриклад використання команди: !дата вступу 2024.01.01")
      .catch((e) => {}));
  }

  if (!active.data[chat_id]![target_id]) {
    return void (await ctx.reply("Користувача не знайдено."));
  }

  active.data[chat_id]![target_id]!.active_first = date;

  return void (await ctx.reply(
    `Успішно змінено дату першої появи в чаті ${active.data[chat_id]![target_id]?.name}!`
  ));
}

export { setUserJoinDate_cmd };
