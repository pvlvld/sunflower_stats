import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";
import isChatOwner from "../../utils/isChatOwner.js";
import { ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { LocaleService } from "../../cache/localeService.js";
import { Database } from "../../db/db.js";

const changeLocale_menu = new Menu<IContext>("changeLocale-menu", {
    autoAnswer: false,
}).dynamic(async (ctx, range) => {
    const chat_id = ctx.chat?.id;
    if (!chat_id) {
        return;
    }

    const currentLocale = await ctx.i18n.getLocale();
    const currentLanguage = (<ILocaleLanguageMap>LOCALE_LANGUAGE_MAP)[currentLocale];

    Object.entries(LOCALE_LANGUAGE_MAP).forEach(([locale, language]) => {
        range
            .text(language === currentLanguage ? `${language} ✅` : language, async (ctx) => {
                ctx.answerCallbackQuery().catch((e) => {});
                if (!(await isChatOwner(chat_id, ctx.from?.id))) return;

                if (currentLocale !== locale) {
                    LocaleService.set(chat_id, locale);
                    await ctx.i18n.renegotiateLocale();
                    ctx.editMessageText(ctx.t("change-locale", { language }), {
                        reply_markup: changeLocale_menu,
                    });
                    Database.chatSettings.set(chat_id, {
                        locale: locale,
                    });
                }
            })
            .row();
    });

    return range;
});

export default changeLocale_menu;
