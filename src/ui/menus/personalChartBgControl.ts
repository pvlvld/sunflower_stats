import type { IContext } from "../../types/context";
import cacheManager from "../../cache/cache";
import { Menu } from "@grammyjs/menu";
import { unlink } from "fs";

const personalChartBgControl_menu = new Menu<IContext>("personalChartBgControl-menu")
  .text("🗑", async (ctx) => {
    const user_id = await parseTargetUserId(ctx);
    if (user_id === undefined) {
      return;
    }
    removeBgAndOptionallyBlock(user_id, false);
    await ctx.deleteMessage().catch((e) => {});
  })
  .row()
  .text("🗑 + ⏳⛔️", async (ctx) => {
    const user_id = await parseTargetUserId(ctx);
    if (user_id === undefined) {
      return;
    }
    removeBgAndOptionallyBlock(user_id, true);
    await ctx.deleteMessage().catch((e) => {});
  })
  .row()
  .text("👌🏻", async (ctx) => {
    void (await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch((e) => {}));
  });

async function parseTargetUserId(ctx: IContext, start_mark = "User id: ") {
  const message_text = ctx.msg?.caption;
  const user_id = message_text?.slice(message_text.indexOf(start_mark) + start_mark.length);
  if (user_id) {
    return Number(user_id);
  } else {
    return void (await ctx.reply("Не вдалося визначити айді користувача.").catch((e) => {}));
  }
}

function removeBgAndOptionallyBlock(user_id: number, block: boolean) {
  unlink(`./data/chartBg/${user_id}.jpg`, (e) => {
    cacheManager.ChartCache_User.removeUser(user_id);
    if (block) {
      cacheManager.RestrictedUsersCache.restrict(user_id, "chartBg", 24 * 60 * 60);
    }
  });
}

export { personalChartBgControl_menu };
