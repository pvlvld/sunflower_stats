import getUserId from "../utils/getUserId";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import type { IGroupTextContext } from "../types/context";
import { getStatsChart } from "../chart/getStatsChart";
import cacheManager from "../cache/cache";
import { DBStats } from "../db/stats";
import cfg from "../config";

async function stats_their(ctx: IGroupTextContext) {
  const chat_id = ctx.chat.id;
  const user_id =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(4), chat_id) ||
    -1;

  if (cfg.IGNORE_IDS.includes(user_id) || ctx.msg.reply_to_message?.from?.is_bot) {
    void (await ctx.reply("Користувача не знайдено."));
  }

  const cachedChart = cacheManager.ChartCache_User.get(chat_id, user_id);

  try {
    switch (cachedChart.status) {
      case "unrendered":
        const chart = await getStatsChart(chat_id, user_id, "user");
        if (chart) {
          const msg = await ctx.replyWithPhoto(chart, {
            caption: getUserStatsMessage(
              chat_id,
              user_id,
              await DBStats.user.all(chat_id, user_id)
            ),
            disable_notification: true,
          });
          cacheManager.ChartCache_User.set(
            chat_id,
            user_id,
            msg.photo[msg.photo.length - 1].file_id
          );
        } else {
          cacheManager.ChartCache_User.set(chat_id, user_id, "");
        }
        return;
      case "ok":
        return void (await ctx.replyWithPhoto(cachedChart.file_id, {
          caption: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
          disable_notification: true,
        }));
      case "skip":
        return void (await ctx.reply(
          getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
          { disable_notification: true, link_preview_options: { is_disabled: true } }
        ));
    }
  } catch (error: any) {
    if (error.description.includes("not enough rights to send photos to the chat")) {
      await ctx.reply(
        "⚠️ Помилка! Як я маю надсилати вам графіки статистики без права на надсилання зображень?!"
      );
    } else {
      console.error(error);
    }
  }
}

export default stats_their;
