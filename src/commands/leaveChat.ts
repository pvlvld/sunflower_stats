import { HearsContext } from "grammy";
import type { MyContext } from "../types/context";
import parseCmdArgs from "../utils/parseCmdArgs";

export async function leaveChat_cmd(ctx: HearsContext<MyContext>) {
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
