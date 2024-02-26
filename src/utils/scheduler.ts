import * as cron from "node-cron";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import TodayStats from "../data/stats";
import path from "path";
import formattedDate from "./date";
import { botStatsManager } from "../commands/botStats";
import collectGarbage from "./collectGarbage";

function createScheduler(active: YAMLWrapper<IActive>, todayStats: TodayStats) {
  return cron.schedule(
    "0 * * * *", //Every hour at 00 minutes
    async (date) => {
      if (date instanceof Date && date.getHours() === 0) {
        await startNewDay(active, todayStats);
      }

      active.save();
      todayStats.save();

      collectGarbage();
    },
    {
      timezone: "Europe/Kiev",
    }
  );
}

export async function startNewDay(
  active: YAMLWrapper<IActive>,
  todayStats: TodayStats
) {
  active.save(path.join("data/active", `active-${formattedDate.today}.yaml`));
  await botStatsManager.sendToMainChat();
  botStatsManager.resetAll();
  await todayStats.writeStatsToDB();
  todayStats.clear();
}

export default createScheduler;
