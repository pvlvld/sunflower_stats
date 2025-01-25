class ChatLocaleCache {
    private readonly cache: Map<number, string> = new Map<number, string>();
    readonly _defaultLocale: string = "uk";

    public get(chat_id: number): string {
        return this.cache.get(chat_id) ?? this._defaultLocale;
    }

    public set(chat_id: number, value: string): void {
        this.cache.set(chat_id, value);
    }

    public delete(chat_id: number): void {
        this.cache.delete(chat_id);
    }

    public seed(): void {
        // TODO:
    }

    public flush(): void {
        this.cache.clear();
    }
}

const chatLocaleCache = new ChatLocaleCache();

export { chatLocaleCache };
