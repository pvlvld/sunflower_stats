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
let _chartCache: Record<string, IChartCache | undefined> = {};
const UnrenderedChart = Object.freeze({ file_id: "", status: "unrendered" } as IChartCache);
const SkipChart = Object.freeze({ file_id: "", status: "skip" }) as IChartCache;

const ChartCache = {
  get: (id: number | string): IChartCache => {
    const chart = _chartCache[id];
    if (chart) {
      return chart;
    }
    return UnrenderedChart;
  },
  set: (id: number | string, file_id: string) => {
    if (file_id.length === 0) {
      _chartCache[id] = SkipChart;
      return;
    }
    _chartCache[id] = { file_id, status: "ok" };
  },
  flush: () => {
    _chartCache = {};
  },
};

const cacheManager = new CacheManager();

export default cacheManager;
