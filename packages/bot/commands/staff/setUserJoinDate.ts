import { isValidDateOrDateRange } from "../../utils/isValidDateOrDateRange.js";
import type { IGroupTextContext } from "../../types/context.js";
import parseCmdArgs from "../../utils/parseCmdArgs.js";
import isChatOwner from "../../utils/isChatOwner.js";
import { active } from "../../redis/active.js";

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

    const user = await active.getUser(chat_id, target_id);
    if (user === null) {
        return void (await ctx.reply("Користувача не знайдено."));
    }

    active.updateUserField(chat_id, target_id, "active_first", date);

    return void (await ctx.reply(`Успішно змінено дату першої появи в чаті ${user.name}!`));
}

export { setUserJoinDate_cmd };
