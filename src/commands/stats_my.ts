import getUserStatsMessage from "../utils/getUserStatsMessage";
import type { IGroupTextContext } from "../types/context";
import { getStatsChart } from "../chart/getStatsChart";
import cacheManager from "../cache/cache";
import dbStats from "../db/stats";
import cfg from "../config";

async function stats_my(ctx: IGroupTextContext) {
  const chat_id = ctx.chat.id;
  const user_id = ctx.from.id;
  if (cfg.IGNORE_IDS.includes(user_id)) {
    return;
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
              await dbStats.user.all(chat_id, user_id)
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
          caption: getUserStatsMessage(chat_id, user_id, await dbStats.user.all(chat_id, user_id)),
          disable_notification: true,
        }));
      case "skip":
        return void (await ctx.reply(
          getUserStatsMessage(chat_id, user_id, await dbStats.user.all(chat_id, user_id)),
          { disable_notification: true, link_preview_options: { is_disabled: true } }
        ));
      default:
        throw new Error("Unknown cachedChart status!");
    }
  } catch (error) {
    console.error(error);
  }
}

export default stats_my;
