import type { ICommandContext } from "../types/context.js";
import changeLocale_menu from "../ui/menus/changeLocaleMenu.js";
import isChatOwner from "../utils/isChatOwner.js";
import { localeNegotiator } from "../utils/localeNegotiator.js";

async function changeLocaleCommand(ctx: ICommandContext) {
    if (ctx.chat.type !== "private" && !(ctx.from && (await isChatOwner(ctx.chat.id, ctx.from.id)))) {
        return;
    }
    const language = await localeNegotiator(ctx);
    await ctx.reply(ctx.t("change-locale", { language }), {
        reply_markup: changeLocale_menu,
    });
}

export { changeLocaleCommand };
