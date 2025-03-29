import {
    IGroupAnimationCaptionContext,
    IGroupHearsCommandContext,
    IGroupPhotoCaptionContext,
} from "../types/context.js";
import { personalChartBgControl_menu } from "../ui/menus/personalChartBgControl.js";
import { resizeImage } from "../chart/processing/resizeImage.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { readFile, writeFile } from "node:fs";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import cfg from "../config.js";
import { isPremium } from "../utils/isPremium.js";
import { Animation, PhotoSize } from "@grammyjs/types";
import { resizeVideo } from "../chart/processing/resizeVideo.js";

const baseBgPath = "./data/chartBg/";

async function setChartBg(
    ctx: IGroupHearsCommandContext | IGroupPhotoCaptionContext | IGroupAnimationCaptionContext,
    type: "chat" | "user"
) {
    if (!ctx.has(":photo") && !ctx.has(":animation")) {
        return void ctx.reply("Щоб змінити фон, наділшіть зображення чи гіф з цією команою в описі.");
    }
    let target_id = -1;

    if (cacheManager.RestrictedUsersCache.isRestricted(ctx.from.id, "chartBg")) {
        return void (await ctx.reply("Вам тимчасово заборонено змінювати фони.").catch((e) => {}));
    }

    if (type === "chat") {
        target_id = ctx.chat.id;
    } else {
        target_id = ctx.from.id;
    }

    if (ctx.from.id === ctx.chat.id || cfg.IGNORE_IDS.includes(target_id)) {
        return void (await ctx
            .reply("Схоже, що ви пишете від імені чату або каналу. Це не підтримується.")
            .catch((e) => {}));
    }

    if (ctx.msg.animation && !((await isPremium(target_id)) || cfg.ADMINS.includes(ctx.from.id))) {
        return void (await ctx.reply("Анімовані фони доступні лише донатерам /donate").catch((e) => {}));
    }

    if (type === "chat") {
        target_id = ctx.chat.id;
        cacheManager.ChartCache_Chat.removeChat(target_id);
    } else {
        target_id = ctx.from.id;
        cacheManager.ChartCache_User.removeUser(target_id);
    }

    const donwloadRes = await downloadBg(ctx, type);

    void (await ctx.reply(donwloadRes.message).catch((e) => {}));
}

const donloadBgErrors = {
    cantSaveImage: {
        status: false,
        message: "Не вдалося зберегти зображення. Спробуйте знову.",
    },
    cantResizeImage: {
        status: false,
        message: "Не вдалося змінити розмір зображення. Спробуйте знову.",
    },
};

async function downloadBg(ctx: IGroupPhotoCaptionContext | IGroupAnimationCaptionContext, type: "user" | "chat") {
    let bgType: "photo" | "animation" = "photo";
    if (ctx.msg.animation) {
        bgType = "animation";
    }

    let file: Animation | PhotoSize | (PhotoSize & string) =
        ctx.msg.animation || ctx.msg.photo![ctx.msg.photo!.length - 1];

    let path = baseBgPath;
    let target_id = -1;

    target_id = type === "chat" ? ctx.chat.id : ctx.from.id;
    path += `${target_id}.${bgType === "photo" ? "jpg" : "mp4"}`;

    const isDownloaded = await (await ctx.api.getFile(file.file_id).catch((e) => {}))?.download(path);

    if (isDownloaded === undefined) {
        return donloadBgErrors.cantSaveImage;
    }

    if (file.width !== cfg.CHART.width || file.height !== cfg.CHART.height) {
        if (bgType === "animation") {
            try {
                await resizeVideo(target_id);
            } catch (e) {
                if (cfg.DEBUG) {
                    console.error(e);
                }

                return donloadBgErrors.cantResizeImage;
            }
        } else {
            readFile(path, async (err, data) => {
                if (err) {
                    return await cantSaveImageError();
                }
                writeFile(path, resizeImage(data), async (err) => {
                    if (err) {
                        return await cantSaveImageError();
                    }
                });
            });
        }
    }

    ctx.api
        .sendPhoto(cfg.ANALYTICS_CHAT, new InputFile(path, "chart.jpg"), {
            caption: `${getUserNameLink.html(
                ctx.from.first_name,
                ctx.from.username,
                target_id
            )} set new <b>${type}</b> chart bg.\nGroup: ${ctx.chat.title}  | @${ctx.chat.username} | ${
                ctx.chat.id
            }\nUser id: ${target_id}\nTarget id: ${target_id}`,
            disable_notification: true,
            message_thread_id: 3992,
            reply_markup: personalChartBgControl_menu,
        })
        .catch((e) => {});

    return { status: true, message: "💅🏻 Фон успішно оновлено!" };
}

async function cantSaveImageError() {
    return {
        status: false,
        message: "Не вдалося зберегти зображення. Спробуйте знову.",
    };
}

export { setChartBg };
