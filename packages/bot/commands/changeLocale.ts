import { LocaleService } from "../cache/localeService.js";
import { LOCALE_LANGUAGE_MAP } from "../consts/localeLanguageMap.js";
import { Database } from "../db/db.js";
import type { IGroupMyChatMemberContext, IHearsCommandContext } from "../types/context.js";
import changeLocale_menu from "../ui/menus/changeLocaleMenu.js";
import isChatOwner from "../utils/isChatOwner.js";
import { localeNegotiator } from "../utils/localeNegotiator.js";

async function changeLocaleCommand(ctx: IHearsCommandContext | IGroupMyChatMemberContext, isForced = false) {
    if (!isForced) {
        if (ctx.chat?.type !== "private" && !(ctx.from && ctx.chat && (await isChatOwner(ctx.chat.id, ctx.from.id)))) {
            return;
        }
    }

    const parts = (ctx.msg?.text || ctx.msg?.caption || "").split(" ");
    if (parts[1]) {
        LocaleService;
        let localeCode = parts[1].toLowerCase() as string | undefined;
        let isLocale = LocaleService.isLocale(localeCode || "");

        if (!isLocale) {
            localeCode = LocaleService.resolveFromLocaleName(localeCode ?? "");
            isLocale = LocaleService.isLocale(localeCode || "");
        }

        if (isLocale) {
            const currentLocale = await localeNegotiator(ctx);
            if (currentLocale !== localeCode) {
                LocaleService.set(ctx.chat.id, localeCode!);
                ctx.i18n.renegotiateLocale();
                Database.chat.settings.set(ctx.chat.id, {
                    locale: localeCode,
                });
                await ctx.reply("✅").catch((e) => {});
                return;
            }
        }
    }

    const localeCode = await localeNegotiator(ctx);
    const language = (LOCALE_LANGUAGE_MAP as Record<string, string>)[localeCode] || localeCode;

    return await ctx.reply(ctx.t("change-locale", { language }), {
        reply_markup: changeLocale_menu,
    });
}

export { changeLocaleCommand };
