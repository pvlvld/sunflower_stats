import {
    IGroupAnimationCaptionContext,
    IGroupHearsCommandContext,
    IGroupPhotoCaptionContext,
} from "../types/context.js";
import { personalChartBgControl_menu } from "../ui/menus/personalChartBgControl.js";
import { resizeImage } from "../chart/processing/resizeImage.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { readFile, unlink, writeFile } from "node:fs";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import cfg from "../config.js";
import { isPremium } from "../utils/isPremium.js";
import { Animation, PhotoSize } from "@grammyjs/types";
import { resizeAndTrimVideo } from "../chart/processing/resizeAndTrimVideo.js";
import Escape from "../utils/escape.js";

const baseBgPath = "./data/chartBg/";

const changeBgMessages = {
    success: {
        status: true,
        message: "chart-bg-change-success",
    },
    howToUse: {
        status: false,
        message: "chart-bg-how-to-use",
    },
    cantSaveImage: {
        status: false,
        message: "chart-bg-save-fail",
    },
    cantResizeImage: {
        status: false,
        message: "chart-bg-resize-fail",
    },
    restricted: {
        status: false,
        message: "chart-bg-change-restricted",
    },
    animationDonateOnly: {
        status: false,
        message: "chart-bg-animation-donate-only",
    },
};

async function setChartBg(
    ctx: IGroupHearsCommandContext | IGroupPhotoCaptionContext | IGroupAnimationCaptionContext,
    type: "chat" | "user"
) {
    if (
        !ctx.has([":photo", "edited_message:photo"]) &&
        !ctx.has([":animation", "edited_message:animation"]) &&
        !ctx.msg.reply_to_message?.photo &&
        !ctx.msg.reply_to_message?.animation
    ) {
        return void ctx.reply(ctx.t(changeBgMessages.howToUse.message));
    }
    let target_id = -1;

    if (cacheManager.RestrictedUsersCache.isRestricted(ctx.from.id, "chartBg")) {
        return void (await ctx.reply(ctx.t("chart-bg-change-restricted")).catch((e) => {}));
    }

    if (type === "chat") {
        target_id = ctx.chat.id;
    } else {
        target_id = ctx.from.id;
    }

    if (ctx.from.id === ctx.chat.id || cfg.IGNORE_IDS.includes(target_id)) {
        return void (await ctx.reply(ctx.t("anon-user-unsupported-error")).catch((e) => {}));
    }

    if (
        (ctx.msg.animation || ctx.msg.reply_to_message?.animation) &&
        !((await isPremium(target_id)) || cfg.ADMINS.includes(ctx.from.id))
    ) {
        return void (await ctx.reply(ctx.t("chart-bg-animation-donate-only")).catch((e) => {}));
    }
    // TODO:
    //@ts-expect-error
    const donwloadRes = await downloadBg(ctx, type);

    if (type === "chat") {
        target_id = ctx.chat.id;
        cacheManager.ChartCache_Chat.removeChat(target_id);
    } else {
        target_id = ctx.from.id;
        cacheManager.ChartCache_User.removeUser(target_id);
    }

    void (await ctx.reply(ctx.t(donwloadRes.message)).catch((e) => {}));
}

async function downloadBg(ctx: IGroupPhotoCaptionContext | IGroupAnimationCaptionContext, type: "user" | "chat") {
    let bgFormat: "photo" | "animation" = "photo";
    if (ctx.msg.animation || ctx.msg.reply_to_message?.animation) {
        bgFormat = "animation";
    }

    let file = (ctx.msg.animation ||
        ctx.msg.photo?.[ctx.msg.photo?.length - 1] ||
        (ctx.msg.reply_to_message?.photo && ctx.msg.reply_to_message.photo[ctx.msg.reply_to_message.photo.length - 1]) ||
        ctx.msg.reply_to_message?.animation) as Animation | PhotoSize | (PhotoSize & string);

    let path = baseBgPath;
    let target_id = -1;

    target_id = type === "chat" ? ctx.chat.id : ctx.from.id;
    path += `${target_id}.${bgFormat === "photo" ? "jpg" : "mp4"}`;

    const isDownloaded = await (await ctx.api.getFile(file.file_id).catch((e) => {}))?.download(path);

    if (isDownloaded === undefined) {
        return changeBgMessages.cantSaveImage;
    }

    if (file.width !== cfg.CHART.width || file.height !== cfg.CHART.height) {
        if (bgFormat === "animation") {
            try {
                await resizeAndTrimVideo(target_id);
            } catch (e) {
                if (cfg.DEBUG) {
                    console.error(e);
                }

                return changeBgMessages.cantResizeImage;
            }
        } else {
            readFile(path, async (err, data) => {
                if (err) {
                    return changeBgMessages.cantSaveImage;
                }
                writeFile(path, resizeImage(data), async (err) => {
                    if (err) {
                        return changeBgMessages.cantSaveImage;
                    }
                    unlink(`${baseBgPath}/${target_id}.mp4`, (e) => {});
                });
            });
        }
    }

    if (bgFormat === "photo") {
        ctx.api
            .sendPhoto(cfg.ANALYTICS_CHAT, new InputFile(path, "chart.jpg"), {
                caption: `${getUserNameLink.html(
                    ctx.from.first_name,
                    ctx.from.username,
                    target_id
                )} set new <b>${type}</b> chart bg.\nGroup: ${Escape.html(ctx.chat.title)}  | @${ctx.chat.username} | ${
                    ctx.chat.id
                }\nUser id: ${target_id}\nTarget id: ${target_id}\nFormat: ${bgFormat}`,
                disable_notification: true,
                message_thread_id: 3992,
                reply_markup: personalChartBgControl_menu,
            })
            .catch((e) => {});
        unlink(`${baseBgPath}/${target_id}.mp4`, (e) => {});
    } else {
        ctx.api
            .sendAnimation(cfg.ANALYTICS_CHAT, new InputFile(path, "chart.mp4"), {
                caption: `${getUserNameLink.html(
                    ctx.from.first_name,
                    ctx.from.username,
                    target_id
                )} set new <b>${type}</b> chart bg.\nGroup: ${Escape.html(ctx.chat.title)}  | @${ctx.chat.username} | ${
                    ctx.chat.id
                }\nUser id: ${target_id}\nTarget id: ${target_id}\nFormat: ${bgFormat}`,
                disable_notification: true,
                message_thread_id: 3992,
                reply_markup: personalChartBgControl_menu,
            })
            .catch((e) => {});
    }
    return changeBgMessages.success;
}

export { setChartBg };
