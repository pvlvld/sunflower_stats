import NodeCache from "node-cache";
import { secondsUntilMidnight } from "../utils/secondsUntilMidnight";

type IPremiumStatusCache = {
  set: (id: number, status: boolean) => void;
  get: (id: number) => any;
  del: (id: number) => void;
};

class PremiumStatusCache {
  private _premiumStatusCache: NodeCache;

  constructor() {
    this._premiumStatusCache = new NodeCache({ stdTTL: 0, checkperiod: 30 });
  }

  public set(id: number, status: boolean) {
    // TODO: connect with donate microservice, update cache on signals
    this._premiumStatusCache.set(id, status, secondsUntilMidnight());
  }
  get(id: number) {
    return this._premiumStatusCache.get(id);
  }
  del(id: number) {
    this._premiumStatusCache.del(id);
  }
}

export { PremiumStatusCache };
