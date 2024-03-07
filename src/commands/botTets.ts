import type { MyContext } from "../types/context";

async function botTest_cmd(ctx: MyContext) {
  await ctx.reply("Тут ✅");
}

export default botTest_cmd;
