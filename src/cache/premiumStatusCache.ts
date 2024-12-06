import NodeCache from "node-cache";
import { secondsUntilMidnight } from "../utils/secondsUntilMidnight.js";
import { getOldDbPool } from "../db/oldDb.js";
import { FieldPacket } from "mysql2";

type IPremiumStatus = Readonly<{ status: boolean; cached: boolean }>;

type IQueryResult =
    | []
    | {
          chat_id: number;
          isPremium: 1;
      }[];

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

    public isCachedPremium(id: number): boolean {
        const premiumStatus = this._premiumStatusCache.get(id) as IPremiumStatus | undefined;
        if (premiumStatus) {
            return premiumStatus.cached ?? false;
        }
        return false;
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

    public async seed_chats() {
        const pool = await getOldDbPool();
        let queryResult: [IQueryResult, FieldPacket[]];
        //@ts-expect-error
        queryResult = await pool.query<IQueryResult>(
            "SELECT chat_id, state as isPremium FROM chats_premium WHERE state = 1;"
        );
        for (const chat of queryResult[0]) {
            this.set(chat.chat_id as number, true);
        }
    }
}

export { PremiumStatusCache };
