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

let _chartCache: Record<string, string | undefined | null> = {};
const ChartCache = {
  /** returns @string file_id on success, @undefined if no cached image @null if chart must not be sent*/
  get: (id: number | string) => {
    return _chartCache[id];
  },
  set: (id: number | string, file_id: string | null) => {
    _chartCache[id] = file_id;
  },
  flush: () => {
    _chartCache = {};
  },
};

const cacheManager = new CacheManager();

export default cacheManager;
