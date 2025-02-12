import { Filter } from "grammy";
import { Database } from "../db/db.js";
import { IContext } from "../types/context.js";

async function chatTitleUpdateHandler(ctx: Filter<IContext, ":new_chat_title">): Promise<void> {
    await Database.poolManager.getPool.query(
        `UPDATE chats SET title = '${ctx.msg.new_chat_title}' WHERE chat_id = ${ctx.chat.id};`
    );
}

export { chatTitleUpdateHandler };
