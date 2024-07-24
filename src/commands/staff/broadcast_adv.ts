import { active } from "../../data/active.js";
import { autoRetry } from "@grammyjs/auto-retry";
import cfg from "../../config.js";
import { Database } from "../../db/db.js";
import { DBPoolManager } from "../../db/poolManager.js";
import { GrammyError, InlineKeyboard } from "grammy";
import moment from "moment";
import { IGroupHearsContext } from "../../types/context.js";

const MediaTypes = ["photo", "animation", "video", "document", "audio"] as const;
type IMediaMethodType = "Photo" | "Animation" | "Video" | "Audio" | "Document" | "Without";
type IMediaMethods = "sendPhoto" | "sendAnimation" | "sendDocument" | "sendVideo" | "sendAudio";
type IMedia = {
  file_id: string;
  type: IMediaMethodType;
};
type IMessage = { media: IMedia; keyboard: InlineKeyboard | undefined; text: string };
type IKeyboard = InlineKeyboard | undefined;

async function broadcast_adv(ctx: IGroupHearsContext, test = true) {
  if (!cfg.ADMINS.includes(ctx.from.id)) {
    return;
  }

  const media = getMessageMedia(ctx);
  let text = (ctx.msg.text ?? ctx.msg.caption).slice("!ssadv ".length);
  const keyboard = extractKeyboard(ctx, text);
  if (!keyboard) {
    return;
  }
  text = keyboard?.text ?? text;
  if (test) {
    // Echo for testing
    await sendAdvMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.btn, text });
  } else {
    await ctx.reply("Починаю розсилку!").catch((e) => {});
    sendAdvMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.btn, text });
    broadcastToChats(ctx, { media, keyboard: keyboard?.btn, text });
  }
  counter = 0;
}

function extractKeyboard(
  ctx: IGroupHearsContext,
  text: string
): { isBtn: boolean; btn: IKeyboard; text: string } | undefined {
  let isBtn = false;
  let btn: IKeyboard = undefined;

  if (text.includes("+btn ")) {
    isBtn = true;
    const text_parts = text.split("\n");
    const raw_btn = text_parts.pop()!;
    text = text_parts.join("\n");

    // Syntax: +btn url text
    const btn_parts = raw_btn.split(" ");
    if (btn_parts.length < 3) {
      return void ctx.reply("Помилка при створенні кнопки.").catch((e) => {});
    }
    void btn_parts.shift();
    const btn_url = btn_parts.shift()!;
    if (!btn_url.startsWith("https://")) {
      return void ctx.reply(`Це не схоже на посилання: ${btn_url}`).catch((e) => {});
    }
    const btn_text = btn_parts.join(" ");
    raw_btn;

    btn = new InlineKeyboard().url(btn_text, btn_url);
  }

  return { isBtn, btn, text };
}
//TODO: remove
let counter = 0;
async function sendAdvMessage(ctx: IGroupHearsContext, chat_id: number | string, adv: IMessage) {
  counter++;
  if (counter < 5220) {
    return true;
  }
  try {
    switch (adv.media.type) {
      case "Photo":
      case "Animation":
      case "Document":
      case "Video":
      case "Audio":
        const method: IMediaMethods = `send${adv.media.type}`;
        await ctx.api[method](chat_id, adv.media.file_id, {
          reply_markup: adv.keyboard,
          caption: adv.text,
          disable_notification: true,
          reply_parameters: {
            message_id: -1,
            allow_sending_without_reply: true,
          },
        });
        break;
      default:
        await ctx.api.sendMessage(chat_id, adv.text, {
          reply_markup: adv.keyboard,
          link_preview_options: { is_disabled: true },
          disable_notification: true,
          reply_parameters: {
            message_id: -1,
            allow_sending_without_reply: true,
          },
        });
        break;
    }
  } catch (e) {
    if (e instanceof GrammyError) {
      if (e.description.includes("bot was kicked")) {
        console.log(e.description, chat_id);
        delete active.data[chat_id];
        void DBPoolManager.getPoolWrite
          .query(`UPDATE chats SET stats_bot_in = false WHERE chat_id = ${chat_id};`)
          .catch((e) => {});
      } else {
        console.error("Broadcasting adv error: ", e);
      }
    } else {
      console.error("Broadcasting adv error: ", e);
    }
    return false;
  }

  return true;
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
  let chat = "";
  let user = "";

  ctx.api.config.use(autoRetry());

  const start = performance.now();

  chat_loop: for (chat in active.data) {
    if (!chat.startsWith("-")) {
      delete active.data[chat];
      continue;
    }

    for (user in active.data[chat]) {
      if (moment().diff(moment(active.data[chat]![user]!.active_last), "days") < 4) {
        totalAttempts++;
        // Skip if bot joined less than 14 days ago
        const botJoinDate = await Database.stats.chat.firstRecordDate(Number(chat));
        if (moment().diff(botJoinDate, "days") < 14) {
          console.log("Adv broadcast: ", chat, "Skip, first message less than 14 days ago");
          continue chat_loop;
        }

        // Sending
        successfullySent += +(await sendAdvMessage(ctx, chat, adv));
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
