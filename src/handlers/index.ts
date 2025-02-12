import { updateChatBotStatus_handler } from "./updateChatBotStatus.js";
import { adminUpdateHandler } from "./adminUpdateHandler.js";
import leaveChatMemberHandler from "./leaveChatMember.js";
import { joinChatMember } from "./joinChatMember.js";
import cfg from "../config.js";
import bot from "../bot.js";
import { chatMigrationHandler } from "./chatMigrationHandler.js";
import { chatTitleUpdateHandler } from "./chatTitleUpdateHandler.js";

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
    });

    bot.on("message:migrate_from_chat_id", chatMigrationHandler.handleFromCtx);

    bot.on(":new_chat_title", chatTitleUpdateHandler);
}

export default regHandlers;
