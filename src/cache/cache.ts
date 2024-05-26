import { LRUCache } from "lru-cache";
import NodeCache from "node-cache";
import { secondsUntilMidnight } from "../utils/secondsUntilMidnight";

type IPremiumStatusCache = {
  set: (id: number, status: boolean) => void;
  get: (id: number) => any;
  del: (id: number) => void;
};

class CacheManager {
  public LRUCache: LRUCache<{}, {}, unknown>;
  public TTLCache: NodeCache;
  public ChartCache: typeof ChartCache;
  public PremiumStatusCache: IPremiumStatusCache;
  private _premiumStatusCache: NodeCache;

  constructor() {
    this.LRUCache = new LRUCache({
      max: 1000,
      updateAgeOnGet: true,
    });

    this.TTLCache = new NodeCache({ stdTTL: 60, checkperiod: 5 });

    this.ChartCache = ChartCache;

    this._premiumStatusCache = new NodeCache({ stdTTL: 0, checkperiod: 30 });
    this.PremiumStatusCache = {
      set: (id: number, status: boolean) => {
        // TODO: connect with donate microservice, update cache on signals
        this._premiumStatusCache.set(id, status, secondsUntilMidnight());
      },
      get: (id: number) => {
        return this._premiumStatusCache.get(id);
      },
      del: (id: number) => {
        this._premiumStatusCache.del(id);
      },
    };
  }
}

type IChartStatuses = "ok" | "skip" | "unrendered";
type IChartCache = { file_id: string; status: IChartStatuses };
const UnrenderedChart = Object.freeze({ file_id: "", status: "unrendered" } as IChartCache);
const SkipChart = Object.freeze({ file_id: "", status: "skip" }) as IChartCache;

const _chartCache: Map<number, Map<number, IChartCache>> = new Map();
const _userChats: Map<number, Set<number>> = new Map();

const ChartCache = {
  get: (chat_id: number, user_id: number): IChartCache => {
    const chatCache = _chartCache.get(chat_id);
    if (chatCache) {
      const chart = chatCache.get(user_id);
      if (chart) {
        return chart;
      }
    }
    return UnrenderedChart;
  },

  set: (chat_id: number, user_id: number, file_id: string) => {
    let chatCache = _chartCache.get(chat_id);
    if (!chatCache) {
      chatCache = new Map();
      _chartCache.set(chat_id, chatCache);
    }

    if (file_id.length === 0) {
      chatCache.set(user_id, SkipChart);
    } else {
      chatCache.set(user_id, Object.freeze({ file_id, status: "ok" }));
    }

    let userChats = _userChats.get(user_id);
    if (!userChats) {
      userChats = new Set();
      _userChats.set(user_id, userChats);
    }
    userChats.add(chat_id);
  },

  remove: (chat_id: number, user_id: number) => {
    const chatCache = _chartCache.get(chat_id);
    if (chatCache) {
      chatCache.delete(user_id);
    }

    const userChats = _userChats.get(user_id);
    if (userChats) {
      userChats.delete(chat_id);
      if (userChats.size === 0) {
        _userChats.delete(user_id);
      }
    }
  },

  removeChat: (chat_id: number) => {
    const chatCache = _chartCache.get(chat_id);
    if (chatCache) {
      let userChats: Set<number> | undefined = undefined;
      for (const user_id of chatCache.keys()) {
        userChats = _userChats.get(user_id);
        if (userChats) {
          userChats.delete(chat_id);
          if (userChats.size === 0) {
            _userChats.delete(user_id);
          }
        }
      }
      _chartCache.delete(chat_id);
    }
  },

  removeUser: (user_id: number) => {
    const userChats = _userChats.get(user_id);
    if (userChats) {
      let chatCache: Map<number, IChartCache> | undefined = undefined;
      for (const chat_id of userChats) {
        chatCache = _chartCache.get(chat_id);
        if (chatCache) {
          chatCache.delete(user_id);
          if (chatCache.size === 0) {
            _chartCache.delete(chat_id);
          }
        }
      }
      _userChats.delete(user_id);
    }
  },

  flush: () => {
    _chartCache.clear();
    _userChats.clear();
  },
};

const cacheManager = new CacheManager();

export default cacheManager;
