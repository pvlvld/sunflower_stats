import { RestrictedUsersCache } from "./restrictedUsersCache.js";
import { PremiumStatusCache } from "./premiumStatusCache.js";
import { ChatSettingsCache } from "./chatSettingsCache.js";
import { ChartCache_User } from "./chartCache_User.js";
import { ChartCache_Chat } from "./chartCache_Chat.js";
import { ChatAdminsCache } from "./chatAdminsCache.js";
import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";
import { TextCache } from "./textCache.js";
import { ChartCache_Global } from "./chartCache_Global.js";

class CacheManager {
    public LRUCache: LRUCache<{}, {}, unknown> = new LRUCache({
        max: 1000,
        updateAgeOnGet: true,
    });
    public TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });
    public ChartCache_User = new ChartCache_User();
    public ChartCache_Chat = new ChartCache_Chat();
    public ChartCache_Global = new ChartCache_Global();
    public PremiumStatusCache = new PremiumStatusCache();
    public ChatSettingsCache = new ChatSettingsCache();
    public ChatAdminsCache = new ChatAdminsCache();
    public RestrictedUsersCache = new RestrictedUsersCache();
    public TextCache = new TextCache();

    flush() {
        this.ChartCache_User.flush();
        this.ChartCache_Chat.flush();
        this.PremiumStatusCache.flush();
        // this.ChatSettingsCache.flush();
        // this.ChatAdminsCache.flush();
        // this.RestrictedUsersCache.flush();
        this.TextCache.flush();
    }

    flushAll() {
        this.flush();
        this.LRUCache.clear();
        this.TTLCache.flushAll();
        this.ChartCache_Global.flush();
    }
}

const cacheManager = new CacheManager();

export default cacheManager;
