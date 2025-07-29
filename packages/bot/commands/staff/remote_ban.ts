import { IGroupHearsContext } from "../../types/context.js";

async function remote_ban_cmd(ctx: IGroupHearsContext): Promise<void> {
    const args = ctx.msg.text!.split(" ");
    if (args.length < 3) return;
    const chat_id = +args[1];
    const user_id = +args[2];

    await ctx.api.banChatMember(chat_id, user_id).catch(console.error);
}

export { remote_ban_cmd };
