import getUserStatsMessage from "../utils/getUserStatsMessage";
import type { IGroupTextContext } from "../types/context";
import { getStatsChart } from "../chart/getStatsChart";
import cacheManager from "../utils/cache";
import dbStats from "../db/stats";
import cfg from "../config";

async function stats_my(ctx: IGroupTextContext) {
  if (cfg.IGNORE_IDS.includes(ctx.from.id)) {
    return;
  }
  const cachedChart = cacheManager.ChartCache.get(ctx.from.id);

  try {
    switch (cachedChart.status) {
      case "unrendered":
        const chart = await getStatsChart(ctx.chat.id, ctx.from.id);
        if (chart) {
          const msg = await ctx.replyWithPhoto(chart, {
            caption: getUserStatsMessage(
              ctx.chat.id,
              ctx.from.id,
              await dbStats.user.all(ctx.chat.id, ctx.from.id)
            ),
            disable_notification: true,
          });
          cacheManager.ChartCache.set(ctx.from.id, msg.photo[msg.photo.length - 1].file_id);
        } else {
          cacheManager.ChartCache.set(ctx.from.id, "");
        }
        return;
      case "ok":
        return void (await ctx.replyWithPhoto(cachedChart.file_id, {
          caption: getUserStatsMessage(
            ctx.chat.id,
            ctx.from.id,
            await dbStats.user.all(ctx.chat.id, ctx.from.id)
          ),
          disable_notification: true,
        }));
      case "skip":
        return void (await ctx.reply(
          getUserStatsMessage(
            ctx.chat.id,
            ctx.from.id,
            await dbStats.user.all(ctx.chat.id, ctx.from.id)
          ),
          { disable_notification: true, link_preview_options: { is_disabled: true } }
        ));
    }
  } catch (error) {
    console.error(error);
  }
}

export default stats_my;
