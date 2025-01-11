import type { IGroupHearsContext } from "../types/context.js";
import getUserId from "../utils/getUserId.js";
import { active } from "../data/active.js";
import Escape from "../utils/escape.js";
import cfg from "../config.js";

async function del_user_active(ctx: IGroupHearsContext) {
    const chatMember = await ctx.getChatMember(ctx.from?.id || -1).catch(() => {});
    const isCanDelOthers = chatMember?.status === "creator" || cfg.ADMINS.includes(ctx.from?.id || -1);
    const rawTarget = (ctx.msg.text ?? ctx.msg.caption).split(" ")[1];

    const chat_id = ctx.chat.id;
    const userId = isCanDelOthers
        ? ctx.msg.reply_to_message?.from?.id || getUserId(rawTarget, chat_id) || ctx.from.id
        : ctx.from.id;

    if (active.data[chat_id]?.[userId]) {
        const targetName = active.data[chat_id][userId].name as string;
        delete active.data[chat_id][userId];
        await ctx
            .reply(`✅ Успішно видалено ${Escape.html(targetName)} з активу та приховано зі статистики.`, {
                parse_mode: "HTML",
            })
            .catch((e) => console.error(e));
    } else {
        await ctx.reply("❌ Користувача не знайдено").catch((e) => {});
    }
    ctx.deleteMessage().catch(() => {});
}

export default del_user_active;
