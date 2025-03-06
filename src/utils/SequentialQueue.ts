type ITask = () => Promise<void>;

class SequentialQueue {
    private queue: Array<{ key: string; task: ITask }> = [];
    private processing: Set<string> = new Set();
    private isProcessing: boolean = false;

    async enqueue(key: string, task: ITask): Promise<void> {
        if (this.processing.has(key)) return;

        return new Promise((resolve) => {
            this.queue.push({
                key,
                task: async () => {
                    try {
                        this.processing.add(key);
                        await task();
                    } catch (error) {
                        this.handleError(key, error);
                    } finally {
                        this.processing.delete(key);
                        resolve();
                    }
                },
            });

            if (!this.isProcessing) this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.queue.length === 0) return void (this.isProcessing = false);
        this.isProcessing = true;

        const queueItem = this.queue.shift();
        if (queueItem) {
            try {
                await queueItem.task();
            } catch (error) {
                this.handleError(queueItem.key, error);
            }
        }

        await this.processQueue();
    }

    private handleError(key: string, error: unknown): void {
        console.error(`SequentialQueue: Error processing task: ${key}`, error);
    }
}

export { SequentialQueue };
