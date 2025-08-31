import { personalChartBgControl_menu } from "./ui/menus/personalChartBgControl.js";
import { historyScanProposal_menu } from "./ui/menus/historyScanProposal.js";
import { ignoreOldMessages } from "./middlewares/ignoreOldMessages.js";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { autoThread } from "./middlewares/autoThreads.js";
// import { leftGroup_menu } from "./ui/menus/leftGroup.js";
import chatCleanup_menu from "./ui/menus/chatCleanup.js";
import { settings_menu } from "./ui/menus/settings.js";
import type { IApi, IContext } from "./types/context.js";
import { I18n } from "@grammyjs/i18n";
import { donate_menu } from "./ui/menus/donate.js";
import { autoRetry } from "@grammyjs/auto-retry";
import { hydrateFiles } from "@grammyjs/files";
import help_menu from "./ui/menus/help.js";
import { Bot, matchFilter } from "grammy";
import cfg from "./config.js";
import { chatStatsPagination_menu } from "./ui/menus/statsPagination.js";
import { blacklist } from "./middlewares/blacklist.js";
import start_menu from "./ui/menus/start.js";
import { localeNegotiator } from "./utils/localeNegotiator.js";
import changeLocale_menu from "./ui/menus/changeLocaleMenu.js";
import { rescan_menu } from "./commands/rescanChatHistory.js";

const bot = new Bot<IContext, IApi>(cfg.BOT_TOKEN);

const autoRetryTransformer = autoRetry({
    maxDelaySeconds: 30,
    maxRetryAttempts: 1,
});

export const i18n = new I18n<IContext>({
    defaultLocale: cfg.DEFAULT_LOCALE,
    directory: "locales",
    localeNegotiator,
    useSession: false,
});

// PLUGINS
// Install the session plugin.
// bot.use(
//   session({
//     initial() {
//       return {};
//     },
//   })
// );

// API TRANSFORMERS

bot.api.config.use(async function autoRetry(prev, method, payload, signal) {
    if (
        ["getChat", "getChatMemberCount", "deleteMessage", "answerCallbackQuery"].includes(method)
    ) {
        return autoRetryTransformer(prev, method, payload, signal);
    }

    return prev(method, payload, signal);
});
bot.api.config.use(parseMode("HTML"));
bot.api.config.use(hydrateFiles(bot.token));
bot.drop(matchFilter(":is_automatic_forward"));

// MIDDLEWARES
bot.use(blacklist.middleware);
bot.use(ignoreOldMessages);
bot.use(autoThread());
bot.use(hydrateReply);
bot.use(i18n);

// MENUS
bot.use(settings_menu);
bot.use(help_menu);
bot.use(start_menu);
bot.use(chatCleanup_menu);
// bot.use(leftGroup_menu);
bot.use(donate_menu);
bot.use(personalChartBgControl_menu);
bot.use(historyScanProposal_menu);
bot.use(chatStatsPagination_menu);
bot.use(changeLocale_menu);
bot.use(rescan_menu);
export default bot;
