import { HearsContext } from "grammy";
import type { MyContext } from "../types/context";
import parseCmdArgs from "../utils/parseCmdArgs";

export async function leaveChat_cmd(ctx: HearsContext<MyContext>) {
  //@ts-expect-error
  const args = parseCmdArgs(ctx.msg.text);
  if (args.length < 1 || isNaN(parseInt(args[0]))) return;

  try {
    const chat = await ctx.api.getChat(args[0]);
    ctx.api.leaveChat(args[0]);
    if (chat.type !== "private") {
      ctx.reply(`Покинуто чат ${chat.title}.`);
    }
  } catch (error) {}
}

export default leaveChat_cmd;
