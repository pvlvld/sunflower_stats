import NodeCache from "node-cache";
import { secondsUntilMidnight } from "../utils/secondsUntilMidnight";

type IPremiumStatus = Readonly<{ status: boolean; cached: boolean }>;

class PremiumStatusCache {
  private _premiumStatusCache: NodeCache;
  private _uncachedStatus: IPremiumStatus;

  constructor() {
    this._premiumStatusCache = new NodeCache({ stdTTL: 0, checkperiod: 30 });
    this._uncachedStatus = Object.freeze({ status: false, cached: false });
  }

  public set(id: number, status: boolean) {
    // TODO: connect with donate microservice, update cache on signals
    const premiumStatus: IPremiumStatus = Object.freeze({
      status,
      cached: true,
    });
    this._premiumStatusCache.set(id, premiumStatus, secondsUntilMidnight());
  }

  public get(id: number): IPremiumStatus {
    const premiumStatus = this._premiumStatusCache.get(id);
    if (premiumStatus) {
      return premiumStatus as IPremiumStatus;
    }
    return this._uncachedStatus;
  }

  public del(id: number) {
    this._premiumStatusCache.del(id);
  }

  public flush() {
    this._premiumStatusCache.flushAll();
  }

  public get size() {
    return this._premiumStatusCache.stats.keys;
  }
}

export { PremiumStatusCache };
