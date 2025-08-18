import type { Filter } from "grammy";
import cacheManager from "../cache/cache.js";
import cfg from "../config.js";
import type { IGroupContext } from "../types/context.js";

async function adminUpdateHandler(ctx: Filter<IGroupContext, "chat_member" | ":left_chat_member">): Promise<void> {
    const chat_id = ctx.chat.id;
    const user_id = ctx.chatMember ? ctx.chatMember.new_chat_member.user.id : ctx.msg.left_chat_member.id;
    const new_status = ctx.chatMember?.new_chat_member.status;
    const old_status = ctx.chatMember?.old_chat_member.status;

    if (new_status === old_status) {
        return;
    }

    if (ctx.chatMember?.new_chat_member.user.is_bot || ctx.msg?.left_chat_member?.is_bot) {
        return;
    }

    // Bot creators unrestrict / unban
    if (cfg.ADMINS.includes(user_id)) {
        if (new_status === "restricted") {
            try {
                await ctx.restrictChatMember(user_id, {
                    can_send_messages: true,
                    can_add_web_page_previews: true,
                    can_change_info: true,
                    can_invite_users: true,
                    can_manage_topics: true,
                    can_pin_messages: true,
                    can_send_audios: true,
                    can_send_documents: true,
                    can_send_other_messages: true,
                    can_send_photos: true,
                    can_send_polls: true,
                    can_send_video_notes: true,
                    can_send_videos: true,
                    can_send_voice_notes: true,
                });
            } catch (error) {
                console.error(`Failed to unrestrict admin ${user_id}:`, error);
            }
        }
        if (new_status === "kicked") {
            try {
                await ctx.unbanChatMember(user_id, { only_if_banned: true });
            } catch (error) {
                console.error(`Failed to unban admin ${user_id}:`, error);
            }
        }
    }

    if (old_status === "administrator" || old_status === "creator") {
        cacheManager.ChatAdminsCache.removeAdmin(chat_id, user_id);
    }

    if (new_status === "administrator" || new_status === "creator") {
        await cacheManager.ChatAdminsCache.addAdmin(chat_id, { user_id, status: new_status });
    }
}

export { adminUpdateHandler };
