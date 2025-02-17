import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../data/active.js";
import { IGroupHearsContext } from "../../types/context.js";
import { Database } from "../../db/db.js";
import { GrammyError } from "grammy";
import { chatMigrationHandler } from "../../handlers/chatMigrationHandler.js";
import Escape from "../../utils/escape.js";

async function updateDbChatsInfo(ctx: IGroupHearsContext) {
    const chats = Object.keys(active.data);
    const total_count = chats.length;
    let count = 0;
    ctx.api.config.use(autoRetry());
    const statusMessage = await ctx.reply(`Оновлення інформації про чати...\n\n0/${total_count}`).catch((e) => {});
    for (const chat of chats) {
        console.log(`Updating chat info for ${chat}`);
        count++;
        const chatInfo = await ctx.api.getChat(chat).catch((e) => {
            if (!(e instanceof GrammyError)) return;
            if (e.description.includes("bot was kicked")) {
                delete active.data[chat];
            }
            if (e.description.includes("group chat was upgraded to a supergroup chat")) {
                chatMigrationHandler.handleFromError(e);
            }
            if (e.description.includes("chat not found")) {
                delete active.data[chat];
            }
        });
        if (!chatInfo) continue;
        Database.poolManager.getPool.query(
            `INSERT INTO public.chats (chat_id, title)
            VALUES (${chatInfo.id}, '$1')
            ON CONFLICT (chat_id)
            DO UPDATE SET title = EXCLUDED.title;`,
            [Escape.html(chatInfo.title || "")]
        );

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
    console.log("Finished updating chats info");
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
