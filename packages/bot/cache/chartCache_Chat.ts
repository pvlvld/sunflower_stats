import { IChartFormat } from "../chart/getStatsChart.js";
import cfg from "../config.js";
import { IChartCache } from "./chartCache_User.js";

type IDateRange = "weekRange" | "monthRange" | "yearRange" | "all";

class ChartCache_Chat {
    private _chartCache: Map<number, Map<IDateRange, IChartCache>>;
    private _unrenderedChart: IChartCache;
    private _skipChart: IChartCache;

    constructor() {
        this._chartCache = new Map();
        this._unrenderedChart = Object.freeze({ file_id: "", status: "unrendered", chartFormat: "image" });
        this._skipChart = Object.freeze({ file_id: "", status: "skip", chartFormat: "image" });
    }

    public get(chat_id: number, range: IDateRange): IChartCache {
        if (!cfg.SETTINGS.charts) {
            return this._skipChart;
        }

        const chatCache = this._chartCache.get(chat_id);
        if (chatCache) {
            const chart = chatCache.get(range || "all");
            if (chart) {
                return chart;
            }
        }

        return this._unrenderedChart;
    }

    public set(chat_id: number, range: IDateRange, file_id: string, chartFormat: IChartFormat) {
        let chatCache = this._chartCache.get(chat_id);
        if (!chatCache) {
            chatCache = new Map();
            void this._chartCache.set(chat_id, chatCache);
        }

        if (file_id.length === 0) {
            void chatCache.set(range, this._skipChart);
        } else {
            void chatCache.set(range, Object.freeze({ file_id, status: "ok", chartFormat }));
        }
    }

    public removeChat(chat_id: number) {
        void this._chartCache.delete(chat_id);
    }

    public flush() {
        this._chartCache.clear();
    }

    public get size(): number {
        let totalSize = 0;
        for (const chatCache of this._chartCache.values()) {
            totalSize += chatCache.size;
        }

        return totalSize;
    }
}

export { ChartCache_Chat };
