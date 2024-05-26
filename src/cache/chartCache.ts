type IChartStatuses = "ok" | "skip" | "unrendered";
type IChartCache = { file_id: string; status: IChartStatuses };

class ChartCache {
  private _chartCache: Map<number, Map<number, IChartCache>>;
  private _userChats: Map<number, Set<number>>;
  private _UnrenderedChart: Readonly<IChartCache>;
  private _SkipChart: Readonly<IChartCache>;

  constructor() {
    this._chartCache = new Map();
    this._userChats = new Map();
    this._SkipChart = Object.freeze({ file_id: "", status: "skip" });
    this._UnrenderedChart = Object.freeze({ file_id: "", status: "unrendered" });
  }

  get(chat_id: number, user_id: number): IChartCache {
    const chatCache = this._chartCache.get(chat_id);
    if (chatCache) {
      const chart = chatCache.get(user_id);
      if (chart) {
        return chart;
      }
    }
    return this._UnrenderedChart;
  }

  set(chat_id: number, user_id: number, file_id: string) {
    let chatCache = this._chartCache.get(chat_id);
    if (!chatCache) {
      chatCache = new Map();
      this._chartCache.set(chat_id, chatCache);
    }

    if (file_id.length === 0) {
      chatCache.set(user_id, this._SkipChart);
    } else {
      chatCache.set(user_id, Object.freeze({ file_id, status: "ok" }));
    }

    let userChats = this._userChats.get(user_id);
    if (!userChats) {
      userChats = new Set();
      this._userChats.set(user_id, userChats);
    }
    userChats.add(chat_id);
  }

  remove(chat_id: number, user_id: number) {
    const chatCache = this._chartCache.get(chat_id);
    if (chatCache) {
      chatCache.delete(user_id);
    }

    const userChats = this._userChats.get(user_id);
    if (userChats) {
      userChats.delete(chat_id);
      if (userChats.size === 0) {
        this._userChats.delete(user_id);
      }
    }
  }

  removeChat(chat_id: number) {
    const chatCache = this._chartCache.get(chat_id);
    if (chatCache) {
      let userChats: Set<number> | undefined = undefined;
      for (const user_id of chatCache.keys()) {
        userChats = this._userChats.get(user_id);
        if (userChats) {
          userChats.delete(chat_id);
          if (userChats.size === 0) {
            this._userChats.delete(user_id);
          }
        }
      }
      this._chartCache.delete(chat_id);
    }
  }

  removeUser(user_id: number) {
    const userChats = this._userChats.get(user_id);
    if (userChats) {
      let chatCache: Map<number, IChartCache> | undefined = undefined;
      for (const chat_id of userChats) {
        chatCache = this._chartCache.get(chat_id);
        if (chatCache) {
          chatCache.delete(user_id);
          if (chatCache.size === 0) {
            this._chartCache.delete(chat_id);
          }
        }
      }
      this._userChats.delete(user_id);
    }
  }

  flush() {
    this._chartCache.clear();
    this._userChats.clear();
  }
}

export { ChartCache };
