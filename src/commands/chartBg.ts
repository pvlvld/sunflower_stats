import { IGroupHearsCommandContext, IGroupPhotoCaptionContext } from "../types/context";
import cacheManager from "../cache/cache";
import { isPremium } from "../utils/isPremium";
import cfg from "../config";
import { InputFile } from "grammy";
import { personalChartBgControl_menu } from "../ui/menus/personalChartBgControl";

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

  //TODO: don't forget reenable it
  // if (!(await isPremium(ctx.from.id))) {
  //   return void (await ctx
  //     .reply(
  //       "Власний фон можуть встановити лише донатери Соняха /donate.\nЯкщо ви нещодавно задонатити, викличте команду /refreshDonate"
  //     )
  //     .catch((e) => {}));
  // }

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
  if (image.width !== 1280 || image.height !== 640) {
    void (await ctx.reply("Зображення має бути 1280 на 640 пікселів.").catch((e) => {}));
    return false;
  }

  try {
    if (type === "chat") {
      await (await ctx.api.getFile(image.file_id)).download(`${baseBgPath}${ctx.chat.id}.jpg`);
    } else {
      await (await ctx.api.getFile(image.file_id)).download(`${baseBgPath}${ctx.from.id}.jpg`);
      ctx.api
        .sendPhoto(
          cfg.ANALYTICS_CHAT,
          new InputFile(`${baseBgPath}${ctx.from.id}.jpg`, "chart.jpg"),
          {
            caption: `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> new chart bg.`,
            disable_notification: true,
            message_thread_id: 3992,
            reply_markup: personalChartBgControl_menu,
          }
        )
        .catch((e) => {});
    }
  } catch (error) {
    void (await ctx.reply("Не вдалося зберегти зображення. Спробуйте знову.").catch((e) => {}));
    return false;
  }

  return true;
}

export { setChartBg_Personal, setChartBg_Chat };
