import type { ICommandContext } from "../types/context.js";
import changeLocale_menu from "../ui/menus/changeLocaleMenu.js";
import { localeNegotiator } from "../utils/localeNegotiator.js";

async function changeLocaleCommand(ctx: ICommandContext) {
    const language = await localeNegotiator(ctx);
    await ctx.reply(ctx.t("change-locale", { language }), {
        reply_markup: changeLocale_menu,
    });
}

export { changeLocaleCommand };
