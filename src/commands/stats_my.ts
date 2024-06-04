import type { IGroupTextContext } from "../types/context";
import { sendSelfdestructMessage } from "../utils/sendSelfdestructMessage";
import { getCachedOrDBChatSettings } from "../utils/chatSettingsUtils";
import getUserStatsMessage from "../utils/getUserStatsMessage";
import { getStatsChart } from "../chart/getStatsChart";
import cacheManager from "../cache/cache";
import { DBStats } from "../db/stats";
import cfg from "../config";

async function stats_my(ctx: IGroupTextContext) {
  const chat_id = ctx.chat.id;
  const user_id = ctx.from.id;
  if (cfg.IGNORE_IDS.includes(user_id)) {
    return;
  }

  const chatSettings = await getCachedOrDBChatSettings(chat_id);
  if (!chatSettings.charts) {
    return void (await sendSelfdestructMessage(
      ctx,
      {
        isChart: false,
        text: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
        chart: undefined,
      },
      chatSettings.selfdestructstats
    ));
  }

  const cachedChart = cacheManager.ChartCache_User.get(chat_id, user_id);

  try {
    switch (cachedChart.status) {
      case "unrendered":
        const chart = await getStatsChart(chat_id, user_id, "user");
        if (chart) {
          const msg = await sendSelfdestructMessage(
            ctx,
            {
              isChart: true,
              text: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
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
              text: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
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
            text: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
            chart: cachedChart.file_id,
          },
          chatSettings.selfdestructstats
        ));

      case "skip":
        return void (await sendSelfdestructMessage(
          ctx,
          {
            isChart: false,
            text: getUserStatsMessage(chat_id, user_id, await DBStats.user.all(chat_id, user_id)),
            chart: undefined,
          },
          chatSettings.selfdestructstats
        ));
      default:
        throw new Error("Unknown cachedChart status!");
    }
  } catch (error: any) {
    console.error(error);
  }
}

export default stats_my;
