import { GrammyError } from "grammy";
import { active } from "../data/active.js";
import { DBPoolManager } from "../db/poolManager.js";
import { IGroupHearsContext } from "../types/context.js";
import { IKeyboard } from "./extractAndMakeKeyboard.js";

const MediaTypes = ["photo", "animation", "video", "document", "audio"] as const;
type IMediaMethodType = "Photo" | "Animation" | "Video" | "Audio" | "Document" | "Without";
type IMediaMethods = "sendPhoto" | "sendAnimation" | "sendDocument" | "sendVideo" | "sendAudio";
type IMedia = {
    file_id: string;
    type: IMediaMethodType;
};
type IMessage = { media: IMedia; keyboard: IKeyboard | undefined; text: string };

async function sendMediaMessage(ctx: IGroupHearsContext, chat_id: number | string, msg: IMessage) {
    try {
        switch (msg.media.type) {
            case "Photo":
            case "Animation":
            case "Document":
            case "Video":
            case "Audio":
                const method: IMediaMethods = `send${msg.media.type}`;
                await ctx.api[method](chat_id, msg.media.file_id, {
                    reply_markup: msg.keyboard,
                    caption: msg.text,
                    disable_notification: true,
                    reply_parameters: {
                        message_id: -1,
                        allow_sending_without_reply: true,
                    },
                });
                break;
            default:
                await ctx.api.sendMessage(chat_id, msg.text, {
                    reply_markup: msg.keyboard,
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
        console.error(e);
        if (e instanceof GrammyError) {
            if (e.description.includes("bot was kicked")) {
                delete active.data[chat_id];
                void DBPoolManager.getPoolWrite
                    .query(`UPDATE chats SET stats_bot_in = false WHERE chat_id = ${chat_id};`)
                    .catch((e) => {});
            }
        }
        return false;
    }

    return true;
}

export { sendMediaMessage, IMessage, IMedia, IMediaMethods, IMediaMethodType, MediaTypes };
