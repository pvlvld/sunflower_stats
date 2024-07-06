import type { IGroupHearsContext } from "../types/context.js";
import { removeChatData } from "../utils/removeChatData.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";

export async function leaveChat_cmd(ctx: IGroupHearsContext) {
  const args = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);
  if (!isNaN(parseInt(args[0] || ""))) {
    try {
      const chat = await ctx.api.getChat(args[0] as string);
      await ctx.api.leaveChat(args[0] as string);
      const removedRows = await removeChatData(args[0] as string);
      if (chat.type !== "private") {
        await ctx.reply(`Покинуто чат ${chat.title}.\nВиделено ${removedRows} записів.`);
      }
    } catch (error) {}
  }
}

export default leaveChat_cmd;
