import parseCmdArgs from "../utils/parseCmdArgs";
import type { MyContext } from "../types/context";

async function getChatInvite_cmd(ctx: MyContext) {
  const chat_id = parseCmdArgs(ctx.msg?.text || "")?.[0];
  if (chat_id) {
    let reply = "";
    try {
      const chat_info = await ctx.api.getChat(chat_id);
      if (chat_info.type === "private") return;
      reply += `${chat_info.title}\n@${"username" in chat_info ? chat_info.username : "-"}\n${
        chat_info.invite_link
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
}

export default getChatInvite_cmd;
