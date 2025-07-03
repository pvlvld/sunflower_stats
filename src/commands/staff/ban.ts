import type { IGroupHearsContext } from "../../types/context.js";
import getUserId from "../../utils/getUserId.js";
import isChatOwner from "../../utils/isChatOwner.js";
import parseCmdArgs from "../../utils/parseCmdArgs.js";

async function ban_cmd(ctx: IGroupHearsContext) {
    if (!(await isChatOwner(ctx.chat.id, ctx.from.id))) return;
    const chat_id = ctx.chat.id;
    const target_id = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);
    // const target_id =
    //     ctx.msg.reply_to_message?.from?.id ||
    //     (await getUserId((ctx.msg.text ?? ctx.msg.caption).slice(6), chat_id)) ||
    //     -1;
    //@ts-expect-error
    return void (await ctx.banChatMember(target_id[0]).catch((e) => {}));
}

export { ban_cmd };
