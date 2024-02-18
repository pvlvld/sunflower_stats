import * as cron from "node-cron";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import TodayStats from "../data/stats";
import path from "path";
import formattedDate from "./date";
import { botStatsManager } from "../commands/botStats";

function createScheduler(active: YAMLWrapper<IActive>, todayStats: TodayStats) {
  return cron.schedule(
    "0 * * * *", //Every hour at 00 minutes
    (date) => {
      if (date instanceof Date && date.getHours() === 0) {
        active.save(
          path.join("data/active", `active-${formattedDate.today}.yaml`)
        );
        todayStats.writeStatsToDB();
        botStatsManager.sendToMainChat();
        botStatsManager.resetAll();
        todayStats.clear(); // Clearing local today stats on midnight
      }

      active.save();
      todayStats.save();
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
