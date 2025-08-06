import * as amqp from "amqplib";
import type { IChartStatsTask, IChartResult } from "../types/types.js";

// TODO:
// - Implement deduplication logic. Set? Map?
// - Normal logging
// - Limit requeue attempts

type IQueues = {
    chart_tasks: IChartStatsTask;
    chart_results: IChartResult;
};

export class RabbitMQClient {
    private static instance: RabbitMQClient;
    private connection: amqp.ChannelModel | null = null;
    private channel: amqp.Channel | null = null;
    private connectionUrl: string;
    private isConnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 5000;

    // Queue names
    private readonly CHART_TASKS_QUEUE = "chart_tasks";
    private readonly CHART_RESULTS_QUEUE = "chart_results";

    private constructor(connectionUrl: string = "amqp://localhost") {
        console.log("RabbitMQClient instance initialized with connection URL:", connectionUrl);
        this.connectionUrl = connectionUrl;
    }

    public static getInstance(connectionUrl?: string): RabbitMQClient {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient(connectionUrl);
        }
        return RabbitMQClient.instance;
    }

    /**
     * Generate a task ID
     *
     * Returns a string in the format "chat_id:user_id:reply_to_message_id:thread_id" to uniquely identify a task.
     */
    public generateTaskId(task: IChartStatsTask): string {
        return `${task.chat_id}:${task.user_id}`;
    }

    public async connect(): Promise<void> {
        if (this.connection || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            this.connection = await amqp.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();
            this.reconnectAttempts = 0;

            await this.setupQueues();

            this.connection.on("close", () => {
                console.warn("RabbitMQ connection closed");
                this.connection = null;
                this.channel = null;
                this.scheduleReconnect();
            });

            this.connection.on("error", (error: Error) => {
                console.error("RabbitMQ connection error:", error);
            });

            console.log("Connected to RabbitMQ successfully");
        } catch (error) {
            this.scheduleReconnect();
            console.error("Error connecting to RabbitMQ:");
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    private async setupQueues(): Promise<void> {
        if (!this.channel) {
            throw new Error("No channel available");
        }

        await this.channel.assertQueue(this.CHART_TASKS_QUEUE, {
            durable: true,
            autoDelete: false,
            maxPriority: 1,
        });

        await this.channel.assertQueue(this.CHART_RESULTS_QUEUE, {
            durable: true,
            autoDelete: false,
        });

        console.log("Queues set up successfully");
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
            return;
        }

        this.reconnectAttempts++;
        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms`);

        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                console.error(`Reconnect attempt ${this.reconnectAttempts} failed:`, error);
            }
        }, this.reconnectDelay);
    }

    private async ensureConnection(): Promise<void> {
        if (!this.connection || !this.channel) {
            await this.connect();
        }
    }

    /**
     * Send a chart rendering task to the queue
     * Returns the taskId for correlation
     */
    public async sendChartTask(task: IChartStatsTask, priority: 0 | 1 = 0): Promise<string> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        if (!task.task_id) {
            task.task_id = this.generateTaskId(task);
        }

        const message = JSON.stringify(task);
        const sent = this.channel.sendToQueue(this.CHART_TASKS_QUEUE, Buffer.from(message), {
            persistent: true,
            priority: priority,
        });

        return task.task_id;
    }

    /**
     * Send chart rendering result back to the results queue
     */
    public async sendChartResult(result: IChartResult): Promise<boolean> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        const message = JSON.stringify(result);
        return this.channel.sendToQueue(this.CHART_RESULTS_QUEUE, Buffer.from(message), {
            persistent: true,
        });
    }

    /**
     * Consume chart tasks (for the render service)
     * @param onTask Callback function to handle the task
     * @returns Promise that resolves when the consumer is set up
     */
    public async consumeChartTasks(
        onTask: (task: IChartStatsTask, message: amqp.ConsumeMessage | null) => void | Promise<void>
    ): Promise<void> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        await this.channel.prefetch(1);

        await this.channel.consume(this.CHART_TASKS_QUEUE, async (message: amqp.ConsumeMessage | null) => {
            if (!message) return;

            try {
                const task: IChartStatsTask = JSON.parse(message.content.toString());
                await onTask(task, message);
                this.channel?.ack(message);
            } catch (error) {
                console.error("Error processing chart task:", error);
                this.channel?.nack(message, false, true); // Requeue on error
            }
        });
    }

    /**
     * Consume chart results (for the bot)
     * @param onResult Callback function to handle the result
     * @returns Promise that resolves when the consumer is set up
     */
    public async consumeChartResults(
        onResult: (result: IChartResult, message: amqp.ConsumeMessage | null) => void | Promise<void>
    ): Promise<void> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        await this.channel.consume(this.CHART_RESULTS_QUEUE, async (message: amqp.ConsumeMessage | null) => {
            if (!message) return;

            try {
                const result: IChartResult = JSON.parse(message.content.toString());
                await onResult(result, message);
                this.channel?.ack(message);
            } catch (error) {
                console.error("Error processing chart result:", error);
                this.channel?.nack(message, false, true);
            }
        });
    }

    public async close(): Promise<void> {
        if (this.channel) {
            try {
                await this.channel.close();
                console.log("RabbitMQ channel closed");
            } catch (error) {
                console.error("Error closing RabbitMQ channel:", error);
            }
            this.channel = null;
        }

        if (this.connection) {
            try {
                await this.connection.close();
                console.log("RabbitMQ connection closed");
            } catch (error) {
                console.error("Error closing RabbitMQ connection:", error);
            }
            this.connection = null;
        }
    }

    public isConnected(): boolean {
        return this.connection !== null && this.channel !== null;
    }

    public getConnectionInfo(): { isConnected: boolean; reconnectAttempts: number } {
        return {
            isConnected: this.isConnected(),
            reconnectAttempts: this.reconnectAttempts,
        };
    }
}
