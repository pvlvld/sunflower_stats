import { LRUCache } from "lru-cache";
import { Database } from "../db/db.js";

class LocaleService {
    private static readonly cache = new LRUCache<number, string>({ max: 3000, allowStale: true });
    static readonly _defaultLocale: string = "en";

    public static async get(id: number): Promise<string> {
        let locale = this.cache.get(id);

        if (locale) return locale;

        locale = await this.fetch(id);
        this.cache.set(id, locale);

        return locale;
    }

    public static set(id: number, value: string): void {
        this.cache.set(id, value);
    }

    public static delete(id: number): void {
        this.cache.delete(id);
    }

    public static async fetch(id: number) {
        const settings = id > 0 ? await Database.userSettings.get(id) : await Database.chatSettings.get(id);
        return settings.locale || this._defaultLocale;
    }

    public static seed(): void {
        // TODO:
    }

    public static flush(): void {
        this.cache.clear();
    }
}

export { LocaleService };
