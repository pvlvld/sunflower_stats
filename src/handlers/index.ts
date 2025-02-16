import { updateChatBotStatus_handler } from "./updateChatBotStatus.js";
import { adminUpdateHandler } from "./adminUpdateHandler.js";
import leaveChatMemberHandler from "./leaveChatMember.js";
import { joinChatMember } from "./joinChatMember.js";
import cfg from "../config.js";
import bot from "../bot.js";
import { chatMigrationHandler } from "./chatMigrationHandler.js";
import { chatTitleUpdateHandler } from "./chatTitleUpdateHandler.js";
import { Database } from "../db/db.js";

function regHandlers() {
    const group = bot.chatType(["group", "supergroup"]);
    group.on("my_chat_member", async (ctx) => {
        updateChatBotStatus_handler(ctx);
    });

    group.on("chat_member", (ctx) => {
        if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.new_chat_member.status)) {
            leaveChatMemberHandler(ctx);
        } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.chatMember.old_chat_member.status)) {
            joinChatMember(ctx);
        }
        adminUpdateHandler(ctx);
        if (ctx.chatMember.new_chat_member.user.id === ctx.me.id) {
            //TODO:
            // - separate into a handler
            // - separate bot join and leave
            // - update join/leave status
            Database.poolManager.getPool.query(
                `INSERT INTO public.chats (chat_id, title)
                                                VALUES (${ctx.chat.id}, '$1')
                                                ON CONFLICT (chat_id)
                                                DO UPDATE SET title = EXCLUDED.title;`,
                [ctx.chat.title]
            );
        }
    });

    bot.on("message:migrate_from_chat_id", chatMigrationHandler.handleFromCtx);

    bot.on(":new_chat_title", chatTitleUpdateHandler);
}

export default regHandlers;
