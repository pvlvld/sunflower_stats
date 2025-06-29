import { IChatSettings } from "../../consts/defaultChatSettings.js";
import type { IContext } from "../../types/context.js";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import { isPremium } from "../../utils/isPremium.js";
import isChatOwner from "../../utils/isChatOwner.js";
import cacheManager from "../../cache/cache.js";
import { Database } from "../../db/db.js";
import { getCachedOrDBChatSettings, getChatSettingsMessageText } from "../../utils/chatSettingsUtils.js";
import cfg from "../../config.js";
import { ILocaleLanguageMap, LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { localeNegotiator } from "../../utils/localeNegotiator.js";
import changeLocale_menu from "./changeLocaleMenu.js";

async function toggleSetting(
    ctx: IContext & MenuFlavor,
    chat_id: number,
    chatSettings: IChatSettings,
    parametr: keyof IChatSettings
) {
    void cacheManager.ChatSettingsCache.set(chat_id, {
        [parametr]: !chatSettings[parametr],
    });
    void ctx.editMessageText(await getChatSettingsMessageText(ctx)).catch((e) => {});
    void Database.chatSettings.set(chat_id, cacheManager.ChatSettingsCache.get(chat_id)!);
}

const settings_menu = new Menu<IContext>("settings-menu", { autoAnswer: true }).dynamic(async (ctx, range) => {
    const chat_id = ctx.chat?.id;
    const from_id = ctx.from?.id;
    if (!chat_id || !from_id) {
        return;
    }

    const chatSettings = await getCachedOrDBChatSettings(chat_id);

    range
        .submenu(
            (ctx) => ctx.t("button-change-language-menu"),
            "changeLocale-menu",
            async (ctx) => {
                ctx.editMessageText(
                    ctx.t("change-locale", {
                        language: (<ILocaleLanguageMap>LOCALE_LANGUAGE_MAP)[await localeNegotiator(ctx)],
                    })
                ).catch((e) => {
                    console.error("Error while entering locale menu from settings:", e);
                });
            }
        )
        .row()
        .text(
            (ctx) => ctx.t("settings-menu-charts"),
            async (ctx) => {
                if (await isChatOwner(chat_id, from_id)) {
                    toggleSetting(ctx, chat_id, chatSettings, "charts");
                }
            }
        )
        .row()
        .text(
            (ctx) => ctx.t("settings-menu-chat-bg-for-members"),
            async (ctx) => {
                if (await isChatOwner(chat_id, from_id)) {
                    if (cfg.ADMINS.includes(from_id) || (await isPremium(chat_id))) {
                        toggleSetting(ctx, chat_id, chatSettings, "usechatbgforall");
                        cacheManager.ChartCache_User.removeChat(chat_id);
                    } else {
                        ctx.reply(ctx.t("settings-menu-donate-alert"));
                    }
                }
            }
        )
        .row()
        .text(
            (ctx) => ctx.t("settings-menu-stats-cmd-admins-only"),
            async (ctx) => {
                if (await isChatOwner(chat_id, from_id)) {
                    toggleSetting(ctx, chat_id, chatSettings, "statsadminsonly");
                }
            }
        )
        .row()
        .text(
            (ctx) => ctx.t("settings-menu-selfdestruct-stats"),
            async (ctx) => {
                if (await isChatOwner(chat_id, from_id)) {
                    toggleSetting(ctx, chat_id, chatSettings, "selfdestructstats");
                }
            }
        )
        .row()
        .text(
            (ctx) => ctx.t("settings-menu-users-link"),
            async (ctx) => {
                if (await isChatOwner(chat_id, from_id)) {
                    toggleSetting(ctx, chat_id, chatSettings, "userstatslink");
                }
            }
        );
});

settings_menu.register(changeLocale_menu);

export { settings_menu };
