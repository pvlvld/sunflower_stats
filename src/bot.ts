import { Bot, matchFilter, session } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { MyContext } from "./types/context";
import { ignoreOldMessages } from "./middlewares/ignoreOldMessages";
import { autoThread } from "./middlewares/autoThreads";
import start_menu from "./ui/menus/start";
import help_menu from "./ui/menus/help";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";

if (!process.env.BOT_TOKEN) throw new Error("Token required");

const bot = new Bot<ParseModeFlavor<MyContext>>(process.env.BOT_TOKEN);

const autoRetryTransformer = autoRetry({
  maxDelaySeconds: 30,
  maxRetryAttempts: 2,
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

bot.api.config.use(async (prev, method, payload, signal) => {
  if (
    [
      "getChat",
      "getChatMemberCount",
      "deleteMessage",
      "answerCallbackQuery",
    ].includes(method)
  ) {
    return autoRetryTransformer(prev, method, payload, signal);
  }

  return prev(method, payload, signal);
});
bot.api.config.use(parseMode("HTML"));

bot.drop(matchFilter(":is_automatic_forward"));

// MIDDLEWARES
// bot.use(ignoreOldMessages); // commented due to dropping old updates on start
bot.use(autoThread());
bot.use(hydrateReply);

// MENUS
bot.use(start_menu);
bot.use(help_menu);

export default bot;
