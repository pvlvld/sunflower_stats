import { MyContext } from "../types/context";
import parseCmdArgs from "../utils/parseCmdArgs";

async function getChatAdmins_cmd(ctx: MyContext) {
  const chat_id = parseCmdArgs(ctx.msg?.text || "")?.[0];
  if (chat_id) {
    let reply = "";
    try {
      const chat_admins = await ctx.api.getChatAdministrators(chat_id);
      chat_admins.forEach((a) => {
        reply += `${a.user.first_name}\n${a.status}\n@${
          a.user.username ?? "-"
        }\n\n`;
      });
      await ctx.reply(reply, {
        disable_notification: true,
      });
    } catch (e) {
      await ctx.reply("Щоь пішло не так.");
      console.error(e);
    }
  }
}

export default getChatAdmins_cmd;
