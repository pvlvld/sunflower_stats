import { active } from "../../data/active.js";
import { autoRetry } from "@grammyjs/auto-retry";
import cfg from "../../config.js";
import { Database } from "../../db/db.js";
import { extractAndMakeKeyboard } from "../../utils/extractAndMakeKeyboard.js";
import moment from "moment";
import { IGroupHearsContext } from "../../types/context.js";
import {
  IMedia,
  IMediaMethodType,
  IMessage,
  MediaTypes,
  sendMediaMessage,
} from "../../utils/sendMediaMessage.js";

async function broadcast_adv(ctx: IGroupHearsContext, test = true) {
  if (!cfg.ADMINS.includes(ctx.from.id)) {
    return;
  }

  const media = getMessageMedia(ctx);
  let text = (ctx.msg.text ?? ctx.msg.caption).slice("!ssadv ".length);
  const keyboard = extractAndMakeKeyboard(ctx, text);
  if (!keyboard) {
    return;
  }
  text = keyboard?.text ?? text;
  if (test) {
    // Echo for testing
    await sendMediaMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.keyboard, text });
  } else {
    await ctx.reply("Починаю розсилку!").catch((e) => {});
    await sendMediaMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.keyboard, text });
    await broadcastToChats(ctx, { media, keyboard: keyboard?.keyboard, text });
  }
}

function getMessageMedia(ctx: IGroupHearsContext): IMedia {
  for (const type of MediaTypes) {
    if (type in ctx.msg) {
      if (Array.isArray(ctx.msg[type])) {
        return { file_id: ctx.msg[type][0].file_id, type: toTitleCase(type) };
      }
      if (typeof ctx.msg[type] === "object") {
        return { file_id: ctx.msg[type].file_id, type: toTitleCase(type) };
      }
    }
  }
  return { file_id: "", type: "Without" };
}

async function broadcastToChats(ctx: IGroupHearsContext, adv: IMessage) {
  let successfullySent = 0;
  let totalAttempts = 0;

  ctx.api.config.use(autoRetry());

  const start = performance.now();

  chat_loop: for (const chat in active.data) {
    if (!chat.startsWith("-")) {
      delete active.data[chat];
      continue;
    }

    for (const user in active.data[chat]) {
      if (moment().diff(moment(active.data[chat]![user]!.active_last), "days") < 4) {
        // Skip if bot joined less than 14 days ago
        const botJoinDate = await Database.stats.chat.firstRecordDate(Number(chat));
        if (moment().diff(botJoinDate, "days") < 14) {
          console.log("Adv broadcast: ", chat, "Skip, first message less than 14 days ago");
          continue chat_loop;
        }
        totalAttempts++;

        // Sending
        successfullySent += +(await sendMediaMessage(ctx, chat, adv));
        break;
      }
    }
  }

  const end = performance.now();
  let timeMinutes = (end - start) / 1000 / 60;
  const timeSeconds = Math.round((timeMinutes % 1) * 60);
  timeMinutes = Math.floor(timeMinutes);

  const logMsg = `Розсилку закінчено за ${timeMinutes}хв ${timeSeconds}с.\nУспішно надіслано ${successfullySent} повідомлень за ${totalAttempts} спроб.`;
  console.log("Adv broadcast: ", logMsg);
  ctx.reply(logMsg).catch((e) => {});
}

function toTitleCase(type: (typeof MediaTypes)[number]) {
  return (type[0].toUpperCase() + type.slice(1)) as IMediaMethodType;
}

export { broadcast_adv };
