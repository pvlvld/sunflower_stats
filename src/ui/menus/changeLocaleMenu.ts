import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";
import isChatOwner from "../../utils/isChatOwner.js";
import { ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { LocaleService } from "../../cache/localeService.js";
import { Database } from "../../db/db.js";
import { getChatSettingsMessageText } from "../../utils/chatSettingsUtils.js";

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
                    Database.chatSettings.set(chat_id, {
                        locale: locale,
                    });
                }
            })
            .row();
    });
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
    return range;
});

export default changeLocale_menu;
