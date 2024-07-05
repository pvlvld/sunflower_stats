import { DBStats } from "../db/stats";

class MessagesStatsBatchStore {
  private _store = new Map<number, Map<number, number>>();
  private _isWriting: boolean = false;

  constructor() {
    this._enableWriting();
  }

  public count(chat_id: number, user_id: number, count = 1) {
    let chat = this._store.get(chat_id);

    if (chat === undefined) {
      chat = new Map();
      this._store.set(chat_id, chat);
    }

    chat.set(user_id, (chat.get(user_id) || 0) + count);
  }

  private *_writeIterator() {
    for (let [chat_id, users] of this._store.entries()) {
      for (let [user_id, count] of users.entries()) {
        if (count !== 0) {
          yield new UserStats(chat_id, user_id, count);
          users.set(user_id, 0);
        }
      }
    }
  }

  private _enableWriting() {
    if (this._isWriting) {
      return;
    }
    this._isWriting = true;

    setInterval(() => this.writeBatch(), 10 * 1000);
  }

  public writeBatch() {
    console.log("write");
    let stats = {} as UserStats;
    for (stats of this._writeIterator()) {
      DBStats.user.countUserMessage(stats.chat_id, stats.user_id, stats.count);
    }
  }
}

class UserStats {
  public readonly chat_id: number;
  public readonly user_id: number;
  public readonly count: number;

  constructor(chat_id: number, user_id: number, count: number) {
    this.chat_id = chat_id;
    this.user_id = user_id;
    this.count = count;
  }
}

const messagesStatsBatchStore = new MessagesStatsBatchStore();

export { messagesStatsBatchStore };
