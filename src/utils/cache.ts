import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
