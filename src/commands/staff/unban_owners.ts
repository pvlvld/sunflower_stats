import cfg from "../../config.js";
import { IGroupHearsCommandContext } from "../../types/context.js";

function unban_owners_cmd(ctx: IGroupHearsCommandContext): void {
    const chat_id = +(ctx.msg.text ?? ctx.msg.caption).split(" ")[1];
    for (const owner of cfg.ADMINS) {
        ctx.api.unbanChatMember(chat_id, owner, { only_if_banned: true }).catch(console.error);
    }
}

export { unban_owners_cmd };
