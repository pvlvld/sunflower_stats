import NodeCache from "@cacheable/node-cache";

type IReason = "chartBg" | "horny" | "uk";

class RestrictedUsersCache {
    private _restrictedUsersCache: NodeCache;

    constructor() {
        this._restrictedUsersCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });
    }

    private _getKey(user_id: number, reason: IReason) {
        return `${reason}_${user_id}`;
    }

    public restrict(user_id: number, reason: IReason, seconds: number) {
        this._restrictedUsersCache.set(this._getKey(user_id, reason), true, seconds);
    }

    public isRestricted(user_id: number, reason: IReason) {
        return this._restrictedUsersCache.has(this._getKey(user_id, reason));
    }
}

export { RestrictedUsersCache };
