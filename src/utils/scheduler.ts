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
        active.save(
          path.join("data/active", `active-${formattedDate.today}.yaml`)
        );
        todayStats.writeStatsToDB();
        await botStatsManager.sendToMainChat();
        botStatsManager.resetAll();
        todayStats.clear(); // Clearing local today stats on midnight
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

export default createScheduler;
// save local
// write to db
// clear
