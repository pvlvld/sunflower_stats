import type { IGroupHearsContext } from "../types/context.js";
import getUserId from "../utils/getUserId.js";
import { active } from "../data/active.js";
import Escape from "../utils/escape.js";
import cfg from "../config.js";

async function del_user_active(ctx: IGroupHearsContext) {
    const chatMember = await ctx.getChatMember(ctx.from?.id || -1).catch(() => {});
    if (chatMember?.status === "creator" || cfg.ADMINS.includes(ctx.from?.id || -1)) {
        const chat_id = ctx.chat.id;
        const userId =
            ctx.msg.reply_to_message?.from?.id ||
            getUserId((ctx.msg.text ?? ctx.msg.caption).slice(13), chat_id) ||
            -1;

        if (userId !== -1 && active.data[chat_id]?.[userId]) {
            const targetName = active.data[chat_id][userId].name as string;
            delete active.data[chat_id][userId];
            await ctx
                .reply(
                    `✅ Успішно видалено ${Escape.html(targetName)} з активу та приховано зі статистики.`,
                    { parse_mode: "HTML" }
                )
                .catch((e) => console.error(e));
            return;
        } else {
            await ctx.reply("❌ Користувача не знайдено").catch((e) => {});
            return;
        }
    }

    await ctx.reply("❌ Щось пішло не так або ви не є власником чату");
    return;
}

export default del_user_active;
