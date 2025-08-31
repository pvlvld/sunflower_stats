import help_cmd from "../../commands/help.js";
import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";
import changeLocale_menu from "./changeLocaleMenu.js";
import { ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { localeNegotiator } from "../../utils/localeNegotiator.js";
import help_menu from "./help.js";

const start_menu = new Menu<IContext>("sart-menu", {
    autoAnswer: true,
})
    .submenu(
        (ctx) => ctx.t("button-change-language-menu"),
        "changeLocale-menu",
        async (ctx) => {
            ctx.editMessageCaption({
                caption: ctx.t("change-locale", {
                    language: (<ILocaleLanguageMap>LOCALE_LANGUAGE_MAP)[
                        await localeNegotiator(ctx)
                    ],
                }),
            }).catch((e) => {
                console.error("Error while changing locale:", e);
            });
        },
    )
    .row()
    .text(
        (ctx) => ctx.t("button-show-commands"),
        (ctx) => void help_cmd(ctx),
    )
    .row()
    .url((ctx) => ctx.t("button-add-bot"), "https://t.me/soniashnyk_statistics_bot?startgroup")
    .row()
    .url((ctx) => ctx.t("button-plz-donate"), "https://send.monobank.ua/jar/6TjRWExdMt");

start_menu.register(changeLocale_menu);
start_menu.register(help_menu);

export default start_menu;
