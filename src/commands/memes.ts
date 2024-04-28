import { Context } from "grammy";

async function memes(ctx: Context) {
  const text = ctx.msg?.text ?? ctx.msg?.caption;

  try {
    if (text?.match(/^смерть р(у|о)сні(!|.)?$/)) {
      return void (await ctx.react("🔥"));
    }
  } catch (e) {}
}

export default memes;
