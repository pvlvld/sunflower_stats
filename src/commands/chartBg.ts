import { IGroupHearsCommandContext, IGroupPhotoCaptionContext } from "../types/context.js";
import { personalChartBgControl_menu } from "../ui/menus/personalChartBgControl.js";
import { resizeImage } from "../chart/processing/resizeImage.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { readFile, writeFile } from "node:fs";
import cacheManager from "../cache/cache.js";
import { InputFile } from "grammy";
import cfg from "../config.js";

const baseBgPath = "./data/chartBg/";

async function setChartBg_Personal(ctx: IGroupHearsCommandContext | IGroupPhotoCaptionContext) {
  if (!ctx.has(":photo")) {
    return void ctx.reply("Щоб змінити фон, наділшіть зображення з цією команою в описі.");
  }

  if (cacheManager.RestrictedUsersCache.isRestricted(ctx.from.id, "chartBg")) {
    return void (await ctx
      .reply("Вам тимчасово заборонено змінювати власний фон.")
      .catch((e) => {}));
  }

  const isDownloaded = await downloadBg(ctx, "user");
  if (!isDownloaded) return;
  cacheManager.ChartCache_User.removeUser(ctx.from.id);

  void (await ctx.reply("💅🏻 Персональний фон успішно оновлено!").catch((e) => {}));
}

async function setChartBg_Chat(ctx: IGroupHearsCommandContext | IGroupPhotoCaptionContext) {
  if (!ctx.has(":photo")) {
    return void ctx.reply("Щоб змінити фон, наділшіть зображення з цією команою в описі.");
  }

  const isDownloaded = await downloadBg(ctx, "chat");
  if (!isDownloaded) return;
  cacheManager.ChartCache_Chat.removeChat(ctx.chat.id);

  void (await ctx.reply("💅🏻 Фон статистики чату успішно оновлено!").catch((e) => {}));
}

async function downloadBg(ctx: IGroupPhotoCaptionContext, type: "user" | "chat") {
  const image = ctx.msg.photo[ctx.msg.photo.length - 1];
  let needToResize = false;
  if (image.width !== 1280 || image.height !== 640) {
    needToResize = true;
  }

  let path = baseBgPath;
  let target_id = -1;

  if (type === "chat") {
    target_id = ctx.chat.id;
    path += `${target_id}.jpg`;
  } else {
    target_id = ctx.from.id;
    path += `${target_id}.jpg`;
  }

  const isDownloaded = await (
    await ctx.api.getFile(image.file_id).catch((e) => {})
  )?.download(path);

  if (isDownloaded === undefined) {
    return await cantSaveImageError(ctx);
  }

  if (needToResize) {
    readFile(path, async (err, data) => {
      if (err) {
        return await cantSaveImageError(ctx);
      }
      data = await resizeImage(data);
      writeFile(path, data, async (err) => {
        if (err) {
          return await cantSaveImageError(ctx);
        }
      });
    });
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

  return true;
}

async function cantSaveImageError(ctx: IGroupHearsCommandContext | IGroupPhotoCaptionContext) {
  void (await ctx.reply("Не вдалося зберегти зображення. Спробуйте знову.").catch((e) => {}));
  return false;
}

export { setChartBg_Personal, setChartBg_Chat };
