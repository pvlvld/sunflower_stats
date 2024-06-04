import type { IGroupContext } from "../types/context";
import { GrammyError, type InputFile } from "grammy";
import cacheManager from "../cache/cache";
import { Message } from "@grammyjs/types";
import { Database } from "../db/db";
import cfg from "../config";

type ISelfdestructMsgChartData = {
  isChart: true;
  text: string;
  chart: string | InputFile;
};

type ISelfdestructMsgWithoutChartData = {
  isChart: false;
  text: string;
  chart: undefined;
};

type ISelfdestructMsgData = ISelfdestructMsgChartData | ISelfdestructMsgWithoutChartData;

async function sendSelfdestructMessage<T extends ISelfdestructMsgData>(
  ctx: IGroupContext,
  data: T,
  selfdestructstats: boolean
): Promise<
  (T extends ISelfdestructMsgChartData ? Message.PhotoMessage : Message.TextMessage) | undefined
> {
  const chat_id = ctx.chat.id;
  try {
    let message: Message.PhotoMessage | Message.TextMessage;
    if (data.isChart) {
      message = await ctx.replyWithPhoto(data.chart, {
        caption: data.text,
        disable_notification: true,
      });
    } else {
      message = await ctx.reply(data.text, {
        disable_notification: true,
      });
    }

    if (selfdestructstats) {
      setTimeout(() => {
        ctx.api.deleteMessage(chat_id, message.message_id).catch((error) => {
          console.error("Cannot self destruct the message. Error:", error);
        });
      }, cfg.STATS_DEFAULT_TTL * 1000);
    }

    return message as T extends ISelfdestructMsgChartData
      ? Message.PhotoMessage
      : Message.TextMessage;
  } catch (e) {
    if (e instanceof GrammyError) {
      if (e.description.includes("message to delete not found")) {
        return undefined;
      }
      if (e.description.includes("not enough rights to send photos to the chat")) {
        void cacheManager.ChatSettingsCache.set(chat_id, {
          charts: false,
        });
        void Database.chatSettings.set(chat_id, cacheManager.ChatSettingsCache.get(chat_id)!);

        void (await ctx
          .reply(
            "У бота немає прав надсилати зображення, графіки статистики було вимкнуто.\nЩоб увімкнути їх, видайте боту права та змініть налаштування в /settings"
          )
          .catch((e) => {}));
        return undefined;
      }
    }
    console.error(e);
    return undefined;
  }
}

export { sendSelfdestructMessage };
