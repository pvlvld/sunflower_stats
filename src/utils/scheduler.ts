import { botStatsManager } from "../commands/botStats.js";
import collectGarbage from "./collectGarbage.js";
import cacheManager from "../cache/cache.js";
import * as cron from "node-cron";

function createScheduler() {
    return cron.schedule(
        "0 * * * *", //Every hour at 00 minutes
        async (date) => {
            if (date instanceof Date && date.getHours() === 0) {
                await startNewDay();
            }

            collectGarbage();
        },
        {
            timezone: "Europe/Kiev",
        }
    );
}

export async function startNewDay() {
    await botStatsManager.sendToAnalyticsChat();
    botStatsManager.resetAll();
    cacheManager.flush();
}

export default createScheduler;
