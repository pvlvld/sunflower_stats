import { RestrictedUsersCache } from "./restrictedUsersCache.js";
import { PremiumStatusCache } from "./premiumStatusCache.js";
import { ChatSettingsCache } from "./chatSettingsCache.js";
import { ChartCache_User } from "./chartCache_User.js";
import { ChartCache_Chat } from "./chartCache_Chat.js";
import { ChatAdminsCache } from "./chatAdminsCache.js";
import { LRUCache } from "lru-cache";
import NodeCache from "@cacheable/node-cache";
import { TextCache } from "./textCache.js";
import { ChartCache_Global } from "./chartCache_Global.js";

class CacheManager {
    public LRUCache: LRUCache<{}, {}, unknown> = new LRUCache({
        max: 1000,
        updateAgeOnGet: true,
    });
    public TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });
    /** Flushes at 00:00 */
    public ChartCache_User = new ChartCache_User();
    /** Flushes at 00:00 */
    public ChartCache_Chat = new ChartCache_Chat();
    public ChartCache_Global = new ChartCache_Global();
    /** Flushes at 00:00 */
    public PremiumStatusCache = new PremiumStatusCache();
    public ChatSettingsCache = new ChatSettingsCache();
    public ChatAdminsCache = new ChatAdminsCache();
    public RestrictedUsersCache = new RestrictedUsersCache();
    /** Flushes at 00:00 */
    public TextCache = new TextCache();

    flush() {
        this.ChartCache_User.flush();
        this.ChartCache_Chat.flush();
        this.PremiumStatusCache.refresh();
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
