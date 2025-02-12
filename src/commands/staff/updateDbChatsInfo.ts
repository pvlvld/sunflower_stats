import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../data/active.js";
import { IGroupHearsContext } from "../../types/context.js";
import { Database } from "../../db/db.js";

async function updateDbChatsInfo(ctx: IGroupHearsContext) {
    const total_count = Object.keys(active.data).length;
    let count = 0;
    ctx.api.config.use(autoRetry());
    const statusMessage = await ctx.reply(`Оновлення інформації про чати...\n\n0/${total_count}`).catch((e) => {});
    for (const chat in active.data) {
        await ctx.api.getChat(chat).then((chatInfo) => {
            if (!chatInfo.title) return;
            Database.poolManager.getPool.query(`INSERT INTO public.chats (chat_id, title)
                VALUES (${chatInfo.id}, '${chatInfo.title}')
                ON CONFLICT (chat_id)
                DO UPDATE SET title = EXCLUDED.title;`);
        });
        count++;
        if (count % 100 !== 0) continue;
        if (statusMessage) {
            await ctx.api
                .editMessageText(
                    statusMessage.chat.id,
                    statusMessage.message_id,
                    `Оновлення інформації про чати...\n\n${count}/${total_count}`
                )
                .catch((e) => {});
        }
    }
    if (statusMessage) {
        ctx.api
            .editMessageText(
                statusMessage.chat.id,
                statusMessage.message_id,
                `Оновлення інформації про чати завершено!\n\n${total_count}/${total_count}`
            )
            .catch((e) => {});
    }
}

export { updateDbChatsInfo };
