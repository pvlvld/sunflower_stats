import type { IGroupContext } from "../types/context.js";
import { GrammyError, type InputFile } from "grammy";
import cacheManager from "../cache/cache.js";
import { Message } from "@grammyjs/types";
import { Database } from "../db/db.js";
import cfg from "../config.js";
import { Menu } from "@grammyjs/menu";
import { IChartFormat } from "../chart/getStatsChart.js";

// TODO: Write our own selfDestruct messsage GrammY plugin (API transformer)

type ISelfdestructMsgChartData = {
    isChart: true;
    chartFormat: IChartFormat;
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
    selfdestructstats: boolean,
    reply_markup?: Menu<any>
): Promise<
    | (T extends ISelfdestructMsgChartData
          ? T["chartFormat"] extends "image"
              ? Message.PhotoMessage
              : Message.AnimationMessage
          : Message.TextMessage)
    | undefined
> {
    const chat_id = ctx.chat.id;
    try {
        let message: Message.PhotoMessage | Message.TextMessage | Message.AnimationMessage;
        if (data.isChart) {
            if (data.chartFormat === "image") {
                message = await ctx.replyWithPhoto(data.chart, {
                    caption: data.text,
                    disable_notification: true,
                    reply_markup,
                });
            } else {
                message = await ctx.replyWithAnimation(data.chart, {
                    caption: data.text,
                    disable_notification: true,
                    reply_markup,
                });
            }
        } else {
            message = await ctx.reply(data.text, {
                disable_notification: true,
                link_preview_options: { is_disabled: true },
                reply_markup,
            });
        }

        if (selfdestructstats) {
            setTimeout(async () => {
                await ctx.api.deleteMessage(chat_id, message.message_id);
            }, cfg.STATS_DEFAULT_TTL * 1000);
        }

        return message as T extends ISelfdestructMsgChartData
            ? T["chartFormat"] extends "image"
                ? Message.PhotoMessage
                : Message.AnimationMessage
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

                void (await ctx.reply(ctx.t("error-ner-photos")).catch((e) => {}));
                return undefined;
            }
        }
        console.error(`Error with selfdestruct message:`, e);
        return undefined;
    }
}

export { sendSelfdestructMessage };
