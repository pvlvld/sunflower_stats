import { getChatUsernameOrInvite } from "../utils/getChatUsernameOrInviteLink.js";
import type { IContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";

async function getChatInvite_cmd(ctx: IContext) {
    const chat_id = Number(parseCmdArgs(ctx.msg?.text || "")?.[0]);
    if (!chat_id) {
        return;
    }

    let reply = "";
    try {
        const chat_info = await getChatUsernameOrInvite(chat_id);
        if (chat_info.type === "error") {
            await ctx.reply("Не вдалось отримати юзернейм або запрошення.");
            return;
        }
        reply += `${chat_info.rawChatInfo.title}\n${
            chat_info.type === "username" ? chat_info.username : chat_info.invite
        }`;
        await ctx.reply(reply, {
            disable_notification: true,
            link_preview_options: { is_disabled: true },
        });
    } catch (e) {
        await ctx.reply("Щось пішло не так.");
        console.error(e);
    }
}

export default getChatInvite_cmd;
