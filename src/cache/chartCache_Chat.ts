type IChartStatuses = "ok" | "unrendered";
type IChartCache = { file_id: string; status: IChartStatuses };
type IDateRange = "weekRange" | "monthRange" | "yearRange" | "all";

class ChartCache_Chat {
  private _chartCache: Map<number, Map<IDateRange, IChartCache>>;
  private _unrenderedChart: IChartCache;

  constructor() {
    this._chartCache = new Map();
    this._unrenderedChart = Object.freeze({ file_id: "", status: "unrendered" });
  }

  get(chat_id: number, range: IDateRange): IChartCache {
    const chatCache = this._chartCache.get(chat_id);
    if (chatCache) {
      const chart = chatCache.get(range);
      if (chart) {
        return chart;
      }
    }

    return this._unrenderedChart;
  }

  set(chat_id: number, range: IDateRange, file_id: string) {
    let chatCache = this._chartCache.get(chat_id);
    if (!chatCache) {
      chatCache = new Map();
      void this._chartCache.set(chat_id, chatCache);
    }

    if (file_id.length === 0) {
      void chatCache.set(range, this._unrenderedChart);
    } else {
      void chatCache.set(range, Object.freeze({ file_id, status: "ok" }));
    }
  }

  removeChat(chat_id: number) {
    void this._chartCache.delete(chat_id);
  }

  flush() {
    this._chartCache.clear();
  }
}

export { ChartCache_Chat };
