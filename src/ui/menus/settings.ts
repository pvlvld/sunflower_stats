import type { IChatSettings } from "../../types/settings.js";
import type { IContext } from "../../types/context.js";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import { isPremium } from "../../utils/isPremium.js";
import isChatOwner from "../../utils/isChatOwner.js";
import cacheManager from "../../cache/cache.js";
import { Database } from "../../db/db.js";
import { getCachedOrDBChatSettings, getChatSettingsMessageText } from "../../utils/chatSettingsUtils.js";
import cfg from "../../config.js";

function getSettingButtonsText(setting: keyof IChatSettings, status: boolean) {
    switch (setting) {
        case "charts":
            if (status) {
                return "Вимкнути графіки";
            } else {
                return "Увімкнути графіки";
            }
        case "usechatbgforall":
            if (status) {
                return "Фон чату лише для стати чату";
            } else {
                return "Фон чату для стати учасників";
            }
        case "statsadminsonly":
            if (status) {
                return "Команди статистики для всіх";
            } else {
                return "Команди статистики лише для адмінів";
            }
        case "selfdestructstats":
            if (status) {
                return "Вимкнути  самознищення повіомлень";
            } else {
                return "Увімкнути самознищення повіомлень";
            }
        case "userstatslink":
            if (status) {
                return "Вимкнути покликання на акаунти в статі";
            } else {
                return "Увімкнути покликання на акаунти в статі";
            }
        default:
            throw new Error("Unknown chat setting!");
    }
}

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
        .text(`${getSettingButtonsText("charts", chatSettings.charts)}`, async (ctx) => {
            if (await isChatOwner(chat_id, from_id)) {
                toggleSetting(ctx, chat_id, chatSettings, "charts");
            }
        })
        .row()
        .text(`${getSettingButtonsText("usechatbgforall", chatSettings.usechatbgforall)}`, async (ctx) => {
            if (await isChatOwner(chat_id, from_id)) {
                if (cfg.ADMINS.includes(from_id) || (await isPremium(chat_id))) {
                    toggleSetting(ctx, chat_id, chatSettings, "usechatbgforall");
                    cacheManager.ChartCache_User.removeChat(chat_id);
                } else {
                    ctx.reply("Ця функція доступна донатерам — введіть команду /donate в потрібному чаті!");
                }
            }
        })
        .row()
        .text(`${getSettingButtonsText("statsadminsonly", chatSettings.statsadminsonly)}`, async (ctx) => {
            if (await isChatOwner(chat_id, from_id)) {
                toggleSetting(ctx, chat_id, chatSettings, "statsadminsonly");
            }
        })
        .row()
        .text(`${getSettingButtonsText("selfdestructstats", chatSettings.selfdestructstats)}`, async (ctx) => {
            if (await isChatOwner(chat_id, from_id)) {
                toggleSetting(ctx, chat_id, chatSettings, "selfdestructstats");
            }
        })
        .row()
        .text(`${getSettingButtonsText("userstatslink", chatSettings.userstatslink)}`, async (ctx) => {
            if (await isChatOwner(chat_id, from_id)) {
                toggleSetting(ctx, chat_id, chatSettings, "userstatslink");
            }
        });
});

export { settings_menu };
