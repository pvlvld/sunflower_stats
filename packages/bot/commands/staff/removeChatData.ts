import type { IGroupTextContext } from "../../types/context.js";
import { removeChatData } from "../../utils/removeChatData.js";

async function removeChatData_cmd(ctx: IGroupTextContext) {
    const chat_id = (ctx.msg.text ?? ctx.msg.caption).split(" ")[1];
    if (chat_id === undefined) {
        return ctx.reply("Вкажіть айді чату:\n!команда -10042069");
    }

    const removedRows = await removeChatData(chat_id);

    if (removedRows === -1) {
        ctx.reply(`Помилка бази даних!`).catch((e) => {});
    }
    ctx.reply(`Видалено ${removedRows} записів.`).catch((e) => {});
}

export { removeChatData_cmd };
