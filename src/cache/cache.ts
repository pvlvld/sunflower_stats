import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";
import { PremiumStatusCache } from "./premiumStatusCache";
import { ChartCache } from "./chartCache";

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;
  public ChartCache: ChartCache;
  public PremiumStatusCache: PremiumStatusCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

    this.ChartCache = new ChartCache();

    this.PremiumStatusCache = new PremiumStatusCache();
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
