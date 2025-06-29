import { LOCALE_LANGUAGE_MAP } from "../consts/localeLanguageMap.js";
import type { ICommandContext } from "../types/context.js";
import changeLocale_menu from "../ui/menus/changeLocaleMenu.js";
import isChatOwner from "../utils/isChatOwner.js";
import { localeNegotiator } from "../utils/localeNegotiator.js";

async function changeLocaleCommand(ctx: ICommandContext) {
    if (ctx.chat.type !== "private" && !(ctx.from && (await isChatOwner(ctx.chat.id, ctx.from.id)))) {
        return;
    }

    const localeCode = await localeNegotiator(ctx);
    LOCALE_LANGUAGE_MAP;
    const language = (<Record<string, string>>LOCALE_LANGUAGE_MAP)[localeCode] || localeCode;

    await ctx.reply(ctx.t("change-locale", { language }), {
        reply_markup: changeLocale_menu,
    });
}

export { changeLocaleCommand };
