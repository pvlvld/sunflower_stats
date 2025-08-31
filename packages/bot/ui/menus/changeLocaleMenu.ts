import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";
import isChatOwner from "../../utils/isChatOwner.js";
import { HIDDEN_LOCALES, ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { LocaleService } from "../../cache/localeService.js";
import { getChatSettingsMessageText } from "../../utils/chatSettingsUtils.js";
import { settingsService } from "../../utils/settingsService.js";

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
        if (HIDDEN_LOCALES.includes(locale)) return; // Skip Niaw's language, it's hidden

        range
            .text(language === currentLanguage ? `${language} ✅` : language, async (ctx) => {
                ctx.answerCallbackQuery().catch((e) => {});
                if (ctx.chat?.type !== "private" && !(await isChatOwner(chat_id, ctx.from?.id))) {
                    ctx.answerCallbackQuery(ctx.t("error-chat-owner-only")).catch((e) => {});
                    return;
                }

                if (currentLocale !== locale) {
                    LocaleService.set(chat_id, locale);
                    await ctx.i18n.renegotiateLocale();
                    if (ctx.msg?.caption) {
                        ctx.editMessageCaption({
                            caption: ctx.t("change-locale", { language }),
                            reply_markup: changeLocale_menu,
                        }).catch((e) => {});
                    } else {
                        ctx.editMessageText(ctx.t("change-locale", { language }), {
                            reply_markup: changeLocale_menu,
                        }).catch((e) => {});
                    }
                    settingsService.setChatSettings(chat_id, {
                        locale: locale,
                    });
                }
            })
            .row();
    });

    if (ctx.chat.type !== "private") {
        range.row().submenu(
            (ctx) => ctx.t("bot-command-settings"),
            "settings-menu",
            async (ctx) => {
                if (ctx.msg?.caption) {
                    ctx.editMessageCaption({
                        caption: await getChatSettingsMessageText(ctx),
                    }).catch((e) => {});
                } else {
                    ctx.editMessageText(await getChatSettingsMessageText(ctx));
                }
            }
        );
    }
    return range;
});

export default changeLocale_menu;
