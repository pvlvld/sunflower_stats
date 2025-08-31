import { IChartFormat } from "@sunflower-stats/shared";
import cfg from "../config.js";

export type IChartStatuses = "ok" | "skip" | "unrendered";
export type IChartCache = Readonly<{
    file_id: string;
    status: IChartStatuses;
    chartFormat: IChartFormat;
}>;

class ChartCache_User {
    private _chartCache: Map<number, Map<number, IChartCache>>;
    private _userChats: Map<number, Set<number>>;
    private _unrenderedChart: IChartCache;
    private _skipChart: IChartCache;

    constructor() {
        this._chartCache = new Map();
        this._userChats = new Map();
        this._skipChart = Object.freeze({ file_id: "", status: "skip", chartFormat: "image" });
        this._unrenderedChart = Object.freeze({
            file_id: "",
            status: "unrendered",
            chartFormat: "image",
        });
    }

    public get(chat_id: number, user_id: number): IChartCache {
        if (!cfg.SETTINGS.charts) {
            return this._skipChart;
        }

        const chatCache = this._chartCache.get(chat_id);
        if (chatCache) {
            const chart = chatCache.get(user_id);
            if (chart) {
                return chart;
            }
        }
        return this._unrenderedChart;
    }

    public set(chat_id: number, user_id: number, file_id: string, chartFormat: IChartFormat) {
        let chatCache = this._chartCache.get(chat_id);
        if (!chatCache) {
            chatCache = new Map();
            void this._chartCache.set(chat_id, chatCache);
        }

        if (file_id.length === 0) {
            void chatCache.set(user_id, this._skipChart);
        } else {
            void chatCache.set(user_id, Object.freeze({ file_id, status: "ok", chartFormat }));
        }

        let userChats = this._userChats.get(user_id);
        if (!userChats) {
            userChats = new Set();
            void this._userChats.set(user_id, userChats);
        }
        void userChats.add(chat_id);
    }

    public remove(chat_id: number, user_id: number) {
        const chatCache = this._chartCache.get(chat_id);
        if (chatCache) {
            void chatCache.delete(user_id);
        }

        const userChats = this._userChats.get(user_id);
        if (userChats) {
            void userChats.delete(chat_id);
            if (userChats.size === 0) {
                void this._userChats.delete(user_id);
            }
        }
    }

    public removeChat(chat_id: number) {
        const chatCache = this._chartCache.get(chat_id);
        if (chatCache) {
            let userChats: Set<number> | undefined = undefined;
            for (const user_id of chatCache.keys()) {
                userChats = this._userChats.get(user_id);
                if (userChats) {
                    void userChats.delete(chat_id);
                    if (userChats.size === 0) {
                        void this._userChats.delete(user_id);
                    }
                }
            }
            void this._chartCache.delete(chat_id);
        }
    }

    public removeUser(user_id: number) {
        const userChats = this._userChats.get(user_id);
        if (userChats) {
            let chatCache: Map<number, IChartCache> | undefined = undefined;
            for (const chat_id of userChats) {
                chatCache = this._chartCache.get(chat_id);
                if (chatCache) {
                    void chatCache.delete(user_id);
                    if (chatCache.size === 0) {
                        void this._chartCache.delete(chat_id);
                    }
                }
            }
            void this._userChats.delete(user_id);
        }
    }

    public flush() {
        this._chartCache.clear();
        this._userChats.clear();
    }

    public get size() {
        let size = 0;
        for (const chatCache of this._chartCache.values()) {
            size += chatCache.size;
        }
        return size;
    }
}

export { ChartCache_User };
