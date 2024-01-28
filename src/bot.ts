import { Bot, matchFilter, session } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";
import { MyContext } from "./types/context";
import { ignoreOldMessages } from "./middlewares/ignoreOldMessages";
import { addFullNameField } from "./middlewares/addFullNameField";
import { autoThread } from "./middlewares/autoThreads";

if (!process.env.BOT_TOKEN) throw new Error("Token required");

const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

const autoRetryTransformer = autoRetry({
  maxDelaySeconds: 60,
  maxRetryAttempts: 3,
  retryOnInternalServerErrors: false,
});

// PLUGINS
// Install the session plugin.
bot.use(
  session({
    initial() {
      return {};
    },
  })
);

// API TRANSFORMERS

bot.api.config.use(async (prev, method, payload, signal) => {
  if (
    [
      'getChat',
      'getChatMemberCount',
      'deleteMessage',
      'answerCallbackQuery',
    ].includes(method)
  ) {
    return autoRetryTransformer(prev, method, payload, signal);
  }

  return prev(method, payload, signal);
});

bot.drop(matchFilter('message:is_automatic_forward'));

// MIDDLEWARES

bot.use(ignoreOldMessages);
bot.use(addFullNameField);
bot.use(autoThread());

// COMMANDS

const pm = bot.chatType('private');
const gm = bot.chatType(['group', 'supergroup']);

export { bot };
