import { LocaleService } from "../cache/localeService.js";
import { ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../consts/localeLanguageMap.js";
import { IContext } from "../types/context.js";

async function localeNegotiator(ctx: IContext): Promise<string> {
    if (ctx.chat) {
        return await LocaleService.get(ctx.chat.id);
    }

    if (ctx.from?.language_code) {
        const isValidLocale = !!(<ILocaleLanguageMap>LOCALE_LANGUAGE_MAP)[ctx.from.language_code];
        if (isValidLocale) {
            return ctx.from.language_code;
        }
    }

    return LocaleService._defaultLocale;
}

export { localeNegotiator };
