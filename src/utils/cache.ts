import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;
  public ChartCache: typeof ChartCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

    this.ChartCache = ChartCache;
  }
}

type IChartStatuses = "ok" | "skip" | "unrendered";
type IChartCache = { file_id: string; status: IChartStatuses };
let _chartCache: Record<string, Record<string, IChartCache | undefined> | undefined> = {};
const UnrenderedChart = Object.freeze({ file_id: "", status: "unrendered" } as IChartCache);
const SkipChart = Object.freeze({ file_id: "", status: "skip" }) as IChartCache;

const ChartCache = {
  get: (chat_id: number, user_id: number): IChartCache => {
    const chart = _chartCache[chat_id]?.[user_id];
    if (chart) {
      return chart;
    }
    return UnrenderedChart;
  },
  set: (chat_id: number, user_id: number, file_id: string) => {
    _chartCache[chat_id] ??= {};
    if (file_id.length === 0) {
      _chartCache[chat_id]![user_id] = SkipChart;
      return;
    }
    _chartCache[chat_id]![user_id] = Object.freeze({ file_id, status: "ok" });
  },
  remove: (chat_id: number, user_id: number) => {
    _chartCache[chat_id] ??= {};
    _chartCache[chat_id]![user_id] = undefined;
  },
  flush: () => {
    _chartCache = {};
  },
};

const cacheManager = new CacheManager();

export default cacheManager;
