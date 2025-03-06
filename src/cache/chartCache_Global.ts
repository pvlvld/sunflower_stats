type ICacheItem = { data: string | undefined; expirationDate: Date };

class ChartCache_Global {
    private _cache: Map<string, ICacheItem>;

    constructor() {
        this._cache = new Map();
    }

    public get(key: string): ICacheItem["data"] {
        const cached = this._cache.get(key);
        if (cached === undefined) return undefined;
        if (new Date() <= new Date(cached.expirationDate)) return cached.data;
        void this._cache.delete(key);
        return undefined;
    }

    public set(key: string, data: string, expirationDate: Date) {
        this._cache.set(key, { data, expirationDate });
    }

    public remove(key: string) {
        this._cache.delete(key);
    }

    public flush() {
        this._cache.clear();
    }

    public get size(): number {
        return this._cache.size;
    }
}

export { ChartCache_Global };
