import parseCmdArgs from "../utils/parseCmdArgs";
import type { IGroupHearsContext } from "../types/context";

export async function leaveChat_cmd(ctx: IGroupHearsContext) {
  const args = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);
  if (!isNaN(parseInt(args[0] || ""))) {
    try {
      const chat = await ctx.api.getChat(args[0] as string);
      await ctx.api.leaveChat(args[0] as string);
      if (chat.type !== "private") {
        await ctx.reply(`Покинуто чат ${chat.title}.`);
      }
    } catch (error) {}
  }
}

export default leaveChat_cmd;
