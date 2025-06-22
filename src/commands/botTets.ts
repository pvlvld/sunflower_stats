import type { IContext } from "../types/context.js";

async function botTest_cmd(ctx: IContext) {
    await ctx.reply("✅");
}

export default botTest_cmd;
