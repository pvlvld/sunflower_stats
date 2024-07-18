import { sleepAsync } from "./sleep.js";

class AsyncTaskQueue {
  private _queue: Map<string | number, () => Promise<any>> = new Map();
  private _isProcessing: boolean = false;

  async enqueue<T>(task: () => Promise<T>, identifier: string | number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.dequeue(identifier);
          this.processQueue();
        }
      };
      if (this._queue.has(identifier)) {
        reject(`Task ${identifier} is already in the queue`);
      } else {
        this._queue.set(identifier, taskWrapper);
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this._isProcessing) {
      return;
    }

    this._isProcessing = true;

    for (const [identifier, task] of this._queue) {
      if (typeof task === "function") {
        try {
          await task();
        } catch (error) {
          console.error(`AsyncTaskQueue: Error processing ${identifier} task:`, error);
        }
      } else {
        console.error(`AsyncTaskQueue: idk ${identifier} seem kinda sus:`, task);
      }
    }

    this._isProcessing = false;
  }

  public dequeue(identifier: string | number) {
    return this._queue.delete(identifier);
  }

  get size() {
    return this._queue.size;
  }
}

export { AsyncTaskQueue };
