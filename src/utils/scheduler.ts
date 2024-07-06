import { botStatsManager } from "../commands/botStats.js";
import collectGarbage from "./collectGarbage.js";
import cacheManager from "../cache/cache.js";
import { active } from "../data/active.js";
import formattedDate from "./date.js";
import * as cron from "node-cron";
import path from "path";

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
  await botStatsManager.sendToAnalyticsChat();
  botStatsManager.resetAll();
  cacheManager.ChartCache_User.flush();
  cacheManager.ChartCache_Chat.flush();
  cacheManager.PremiumStatusCache.flush();
}

export default createScheduler;
