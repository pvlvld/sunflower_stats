import help_menu from "./ui/menus/help";
import start_menu from "./ui/menus/start";
import { Bot, matchFilter } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { autoThread } from "./middlewares/autoThreads";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { ignoreOldMessages } from "./middlewares/ignoreOldMessages";
import type { MyContext } from "./types/context";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import cfg from "./config";

const bot = new Bot<MyContext>(cfg.BOT_TOKEN);

const autoRetryTransformer = autoRetry({
  maxDelaySeconds: 30,
  maxRetryAttempts: 1,
  retryOnInternalServerErrors: false,
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
  if (["getChat", "getChatMemberCount", "deleteMessage", "answerCallbackQuery"].includes(method)) {
    return autoRetryTransformer(prev, method, payload, signal);
  }

  return prev(method, payload, signal);
});
bot.api.config.use(parseMode("HTML"));

bot.drop(matchFilter(":is_automatic_forward"));

// MIDDLEWARES
bot.use(ignoreOldMessages);
bot.use(autoThread());
bot.use(hydrateReply);

// MENUS
bot.use(start_menu);
bot.use(help_menu);

export default bot;
