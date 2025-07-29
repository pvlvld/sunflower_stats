import type { ICommandContext, IContext } from "../types/context.js";
import { donate_menu } from "../ui/menus/donate.js";
import cacheManager from "../cache/cache.js";
import type { Filter } from "grammy";

async function donate_cmd(ctx: Filter<IContext, ":text">) {
    if (ctx.chat.type == "private") {
        ctx.reply(ctx.t("donate-private"), { reply_markup: donate_menu });
    } else {
        ctx.reply(ctx.t("donate-group"), { reply_markup: donate_menu });
    }
}

async function refreshDonate_cmd(ctx: ICommandContext) {
    if (!ctx.from?.id) {
        return;
    }

    cacheManager.PremiumStatusCache.del(ctx.from.id);
    cacheManager.PremiumStatusCache.del(ctx.chat.id);
    void (await ctx.reply("✅").catch((e) => {}));
}

export { donate_cmd, refreshDonate_cmd };
