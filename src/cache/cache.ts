import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";
import { PremiumStatusCache } from "./premiumStatusCache";
import { ChartCache_User } from "./chartCache_User";
import { ChartCache_Chat } from "./chartCache_Chat";
import { ChatSettingsCache } from "./chatSettingsCache";
import { ChatAdminsCache } from "./chatAdminsCache";
import { RestrictedUsersCache } from "./restrictedUsersCache";

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;
  public ChartCache_User: ChartCache_User;
  public ChartCache_Chat: ChartCache_Chat;
  public PremiumStatusCache: PremiumStatusCache;
  public ChatSettingsCache: ChatSettingsCache;
  public ChatAdminsCache: ChatAdminsCache;
  public RestrictedUsersCache: RestrictedUsersCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

    this.ChartCache_User = new ChartCache_User();

    this.ChartCache_Chat = new ChartCache_Chat();

    this.PremiumStatusCache = new PremiumStatusCache();

    this.ChatSettingsCache = new ChatSettingsCache();

    this.ChatAdminsCache = new ChatAdminsCache();

    this.RestrictedUsersCache = new RestrictedUsersCache();
  }
}

const cacheManager = new CacheManager();

export default cacheManager;
