import type { IGroupTextContext } from "../types/context";
import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import { isUserStatsEmpty } from "../utils/isUserStatsEmpty";
import { getStatsChart } from "../chart/getStatsChart";
import getUserId from "../utils/getUserId";
import cacheManager from "../cache/cache";
import { DBStats } from "../db/stats";
import cfg from "../config";

async function stats_their(ctx: IGroupTextContext) {
  const chat_id = ctx.chat.id;
  const user_id =
    ctx.msg.reply_to_message?.from?.id ||
    getUserId((ctx.msg.text ?? ctx.msg.caption).slice(4), chat_id) ||
    -1;

  try {
    if (cfg.IGNORE_IDS.includes(user_id) || ctx.msg.reply_to_message?.from?.is_bot) {
      return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats, {
        caption: "Користувача не знайдено.",
      }));
    }

    const stats = await DBStats.user.all(chat_id, user_id);

    if (isUserStatsEmpty(stats)) {
      return void (await ctx.replyWithAnimation(cfg.MEDIA.ANIMATIONS.no_stats, {
        caption: "Я не знайшов статистики цього користувача.",
      }));
    }

    const chatSettings = await getCachedOrDBChatSettings(chat_id);
    const statsMessage = getUserStatsMessage(chat_id, user_id, stats);

    if (!chatSettings.charts) {
      return void (await sendSelfdestructMessage(
        ctx,
        {
          isChart: false,
          text: statsMessage,
          chart: undefined,
        },
        chatSettings.selfdestructstats
      ));
    }

    const cachedChart = cacheManager.ChartCache_User.get(chat_id, user_id);

    switch (cachedChart.status) {
      case "unrendered":
        const chart = await getStatsChart(chat_id, user_id, "user");
        if (chart) {
          const msg = await sendSelfdestructMessage(
            ctx,
            {
              isChart: true,
              text: statsMessage,
              chart: chart,
            },
            chatSettings.selfdestructstats
          );

          if (!msg) {
            return;
          }

          cacheManager.ChartCache_User.set(
            chat_id,
            user_id,
            msg.photo[msg.photo.length - 1].file_id
          );
        } else {
          cacheManager.ChartCache_User.set(chat_id, user_id, "");
          return void (await sendSelfdestructMessage(
            ctx,
            {
              isChart: false,
              text: statsMessage,
              chart: undefined,
            },
            chatSettings.selfdestructstats
          ));
        }
        return;
      case "ok":
        return void (await sendSelfdestructMessage(
          ctx,
          {
            isChart: true,
            text: statsMessage,
            chart: cachedChart.file_id,
          },
          chatSettings.selfdestructstats
        ));
      case "skip":
        return void (await sendSelfdestructMessage(
          ctx,
          {
            isChart: false,
            text: statsMessage,
            chart: undefined,
          },
          chatSettings.selfdestructstats
        ));
    }
  } catch (error: any) {
    console.error(error);
  }
}

export default stats_their;
