import { botStatsManager } from "../commands/botStats.js";
import collectGarbage from "./collectGarbage.js";
import cacheManager from "../cache/cache.js";
import * as cron from "node-cron";

function createScheduler() {
    return cron.schedule(
        "0 0 * * *", // at midnight
        async (date) => {
            await startNewDay();
            collectGarbage();
        },
        {
            timezone: "Europe/Kiev",
        },
    );
}

export async function startNewDay() {
    await botStatsManager.sendToAnalyticsChat();
    botStatsManager.resetAll();
    cacheManager.flush();
}

export default createScheduler;
