import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";
import { PremiumStatusCache } from "./premiumStatusCache";
import { ChartCache_User } from "./chartCache_User";

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;
  public ChartCache_User: ChartCache_User;
  public PremiumStatusCache: PremiumStatusCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

    this.ChartCache_User = new ChartCache_User();

    this.PremiumStatusCache = new PremiumStatusCache();
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
