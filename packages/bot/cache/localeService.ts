import { LRUCache } from "lru-cache";
import { Database } from "../db/db.js";
import cfg from "../config.js";
import {
    ILocaleLanguageMap,
    LOCALE_LANGUAGE_MAP,
    LOCALE_LANGUAGE_MAP_REVERSED,
} from "../consts/localeLanguageMap.js";

class LocaleService {
    private static readonly cache = new LRUCache<number, string>({ max: 3000, allowStale: true });
    static readonly _defaultLocale: string = cfg.DEFAULT_LOCALE;

    public static async get(id: number): Promise<string> {
        let locale = this.cache.get(id);

        if (!locale) {
            locale = await this.fetch(id);
        }

        this.cache.set(id, locale);

        return locale;
    }

    public static set(id: number, value: string): void {
        this.cache.set(id, value || this._defaultLocale);
    }

    public static delete(id: number): void {
        this.cache.delete(id);
    }

    public static async fetch(id: number) {
        const settings =
            id > 0 ? await Database.user.settings.get(id) : await Database.chat.settings.get(id);
        return settings.locale || this._defaultLocale;
    }

    public static isValid(locale: string): boolean {
        return !!(<ILocaleLanguageMap>LOCALE_LANGUAGE_MAP)[locale];
    }

    // Alias for isValid
    public static isLocale = this.isValid;

    public static resolveFromLocaleName(localeName: string): string | undefined {
        return LOCALE_LANGUAGE_MAP_REVERSED[
            localeName as keyof typeof LOCALE_LANGUAGE_MAP_REVERSED
        ];
    }

    public static async seed() {
        await this.seedChats();
    }

    private static async seedChats() {
        const data = await Database.chat.settings.getChatsLocaleWithActiveUsersSinceNDays(2);
        for (let i = 0; i < data.length; i++) {
            this.cache.set(data[i][0], data[i][1]);
        }
    }

    public static flush(): void {
        this.cache.clear();
    }
}

export { LocaleService };
