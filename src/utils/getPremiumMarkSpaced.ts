import cacheManager from "../cache/cache.js";

function getPremiumMarkSpaced(id: number) {
    return cacheManager.PremiumStatusCache.get(id).status ? " 👑 " : " ";
}

export { getPremiumMarkSpaced };
