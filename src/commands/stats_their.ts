import getUserId from "../utils/getUserId";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import type { IGroupTextContext } from "../types/context";
import { getStatsChart } from "../chart/getStatsChart";
import cacheManager from "../utils/cache";
import dbStats from "../db/stats";
import cfg from "../config";

function getChartCacheKey(chat_id: number, user_id: number) {
  return `${chat_id}_${user_id}`;
}

async function stats_their(ctx: IGroupTextContext) {
  const userId =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(4), ctx.chat.id) ||
    -1;

  if (cfg.IGNORE_IDS.includes(ctx.from.id) || ctx.msg.reply_to_message?.from?.is_bot) {
    void (await ctx.reply("Користувача не знайдено."));
  }

  const chartCacheKey = getChartCacheKey(ctx.chat.id, userId);
  const cachedChart = cacheManager.ChartCache.get(chartCacheKey);

  try {
    switch (cachedChart.status) {
      case "unrendered":
        const chart = await getStatsChart(ctx.chat.id, userId);
        if (chart) {
          const msg = await ctx.replyWithPhoto(chart, {
            caption: getUserStatsMessage(
              ctx.chat.id,
              userId,
              await dbStats.user.all(ctx.chat.id, userId)
            ),
            disable_notification: true,
          });
          cacheManager.ChartCache.set(chartCacheKey, msg.photo[msg.photo.length - 1].file_id);
        } else {
          cacheManager.ChartCache.set(chartCacheKey, "");
        }
        return;
      case "ok":
        return void (await ctx.replyWithPhoto(cachedChart.file_id, {
          caption: getUserStatsMessage(
            ctx.chat.id,
            userId,
            await dbStats.user.all(ctx.chat.id, userId)
          ),
          disable_notification: true,
        }));
      case "skip":
        return void (await ctx.reply(
          getUserStatsMessage(ctx.chat.id, userId, await dbStats.user.all(ctx.chat.id, userId)),
          { disable_notification: true, link_preview_options: { is_disabled: true } }
        ));
    }
  } catch (error) {
    console.error(error);
  }
}

export default stats_their;
