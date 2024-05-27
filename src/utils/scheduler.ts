import path from "path";
import * as cron from "node-cron";
import formattedDate from "./date";
import collectGarbage from "./collectGarbage";
import { botStatsManager } from "../commands/botStats";
import { active } from "../data/active";
import cacheManager from "../cache/cache";

function createScheduler() {
  return cron.schedule(
    "0 * * * *", //Every hour at 00 minutes
    async (date) => {
      if (date instanceof Date && date.getHours() === 0) {
        await startNewDay();
        active.save();
      }

      collectGarbage();
    },
    {
      timezone: "Europe/Kiev",
    }
  );
}

export async function startNewDay() {
  active.save(path.join("data/active", `active-${formattedDate.today[0]}.yaml`));
  await botStatsManager.sendToMainChat();
  botStatsManager.resetAll();
  cacheManager.ChartCache_User.flush();
}

export default createScheduler;
