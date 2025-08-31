import { IGroupHearsContext } from "../../types/context.js";

async function sayToChat(ctx: IGroupHearsContext) {
    const parts = (ctx.msg.text ?? ctx.msg.caption).split(" ");
    void parts.shift();
    const target_id = parts.shift()!;
    if (!parseInt(target_id)) {
        ctx.reply(`Некоректний айді: ${target_id}`).catch((e) => {});
        return;
    }

    ctx.api.sendMessage(target_id, "");
}
