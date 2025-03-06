import { DefaultChartSettings, IChartSettings } from "../../db/chartSettings.js";
import { Database } from "../../db/db.js";
import { getCachedOrDBChatSettings } from "../../utils/chatSettingsUtils.js";
import { IChartType } from "../getStatsChart.js";

async function getChartSettings(target_id: number, type: IChartType): Promise<IChartSettings> {
    if (type === "chat") return await getCachedOrDBChatSettings(target_id);
    if (type === "user") return await Database.userSettings.get(target_id);
    return DefaultChartSettings;
}

export { getChartSettings };
