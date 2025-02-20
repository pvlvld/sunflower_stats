class TextCache {
    private readonly cache = new Map<string | number, string>();

    public get(key: string | number): string | undefined {
        return this.cache.get(String(key));
    }

    public set(key: string | number, value: string): void {
        this.cache.set(String(key), value);
    }

    public delete(key: string | number): void {
        this.cache.delete(String(key));
    }

    public flush(): void {
        this.cache.clear();
    }
}

export { TextCache };
