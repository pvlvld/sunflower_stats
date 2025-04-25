import { autoRetry } from "@grammyjs/auto-retry";
import { IGroupHearsContext } from "../../types/context.js";
import { Database } from "../../db/db.js";
import { GrammyError } from "grammy";
import { chatMigrationHandler } from "../../handlers/chatMigrationHandler.js";
import { active } from "../../redis/active.js";

async function updateDbChatsInfo(ctx: IGroupHearsContext) {
    // TEMPORARY
    const chats_active = await active.getAllChatIds();
    let chats = (await Database.poolManager.getPool.query("SELECT chat_id FROM chats WHERE title IS NULL")).rows.map(
        (r) => <number>r.chat_id
    );
    chats = chats.filter((c) => chats_active.indexOf(c) != -1);
    // TEMPORARY

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
                active.removeChat(chat);
            }
            if (e.description.includes("group chat was upgraded to a supergroup chat")) {
                chatMigrationHandler.handleFromError(e);
            }
            if (e.description.includes("chat not found")) {
                active.removeChat(chat);
            }
        });
        if (!chatInfo) continue;
        Database.poolManager.getPool.query(
            `INSERT INTO public.chats (chat_id, title)
            VALUES ($1, $2)
            ON CONFLICT (chat_id)
            DO UPDATE SET title = EXCLUDED.title`,
            [chatInfo.id, chatInfo.title || ""]
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
