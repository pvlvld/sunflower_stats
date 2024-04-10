import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";

class CacheManager {
  public LRU: LRUCache<{}, {}, unknown>;
  public TTL: NodeCache;

  constructor() {
    this.LRU = new LRUCache({
      max: 100,
      updateAgeOnGet: true,
    });

    this.TTL = new NodeCache({ stdTTL: 60, checkperiod: 5 });
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
