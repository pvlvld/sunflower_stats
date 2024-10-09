import { Context } from "grammy";

async function memes(ctx: Context) {
    const text = (ctx.msg?.text ?? ctx.msg?.caption)?.toLowerCase();

    try {
        if (text?.match(/^смерть р(у|о)сні(!|.)?$/)) {
            return void (await ctx.react("🔥").catch((e) => {}));
        }

        if (text?.match(/hamster_kombat_bot/i)) {
            return void (await ctx.react("💩"));
        }

        if (ctx.msg?.text === "@pvlvld" || ctx.msg?.text === "@uli_sunflower") {
            return void ctx.react("❤").catch((e) => {});
        }
        if (ctx.msg?.text?.includes("pvlvld") || ctx.msg?.text?.includes("uli_sunflower"))
            ctx.react("👀").catch((e) => {});

        if (ctx.msg?.caption?.includes("екомендації по збору дикоросів")) {
            ctx.deleteMessage();
        }

        if (ctx.msg?.from?.id == 5147076742) {
            // Кіт
            return void ctx.react("❤").catch((e) => {});
        }
    } catch (e) {}
}

export default memes;
