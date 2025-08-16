import * as amqp from "amqplib";
import type { IChartStatsTask, IChartResult } from "../types/types.js";

type IQueues = {
    chart_stats_tasks: IChartStatsTask;
    chart_stats_results: IChartResult;

    bump_chart_rating_tasks: unknown;
    bump_chart_rating_results: unknown;
};

export type IQueueConfig = amqp.Options.AssertQueue;

export type IProduceOptions = amqp.Options.Publish;

export type IConsumeOptions = amqp.Options.Consume & {
    prefetchCount?: number;
};

// TODO:
// - Implement deduplication logic. Set? Map?
// - Normal logging
// - Limit requeue attempts

export class RabbitMQClient {
    private static instance: RabbitMQClient;
    private connection: amqp.ChannelModel | null = null;
    private channel: amqp.Channel | null = null;
    private connectionUrl: string;
    private isConnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 5000;
    private assertedQueues: Set<string> = new Set();

    private constructor(connectionUrl: string) {
        console.log("RabbitMQClient instance initialized");
        this.connectionUrl = connectionUrl;
    }

    public static getInstance(username: string, password: string): RabbitMQClient {
        if (!RabbitMQClient.instance) {
            RabbitMQClient.instance = new RabbitMQClient(`amqp://${username}:${password}@localhost`);
        }
        return RabbitMQClient.instance;
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

            this.connection.on("close", () => {
                console.warn("RabbitMQ connection closed");
                this.connection = null;
                this.channel = null;
                this.assertedQueues.clear();
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

    private async ensureConnection(): Promise<void> {
        if (!this.connection || !this.channel) {
            await this.connect();
        }
    }

    public async assertQueue(queueName: keyof IQueues, config: IQueueConfig = {}): Promise<void> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        await this.channel.assertQueue(queueName, config);
        this.assertedQueues.add(queueName);
        console.log(`Queue "${queueName}" asserted successfully`);
    }

    public async produce<T extends keyof IQueues>(
        queueName: T,
        message: IQueues[T],
        options: IProduceOptions
    ): Promise<boolean> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        if (!this.assertedQueues.has(queueName)) {
            await this.assertQueue(queueName);
        }

        const messageBuffer = Buffer.from(JSON.stringify(message));
        return this.channel.sendToQueue(queueName, messageBuffer, options);
    }

    public async consume<T extends keyof IQueues>(
        queueName: T,
        onMessage: (message: IQueues[T], rawMessage: amqp.ConsumeMessage | null) => void | Promise<void>,
        options: IConsumeOptions = {}
    ): Promise<void> {
        await this.ensureConnection();

        if (!this.channel) {
            throw new Error("No channel available");
        }

        if (!this.assertedQueues.has(queueName)) {
            await this.assertQueue(queueName);
        }

        const defaultOptions: IConsumeOptions = {
            prefetchCount: 1,
            noAck: false,
        };

        const finalOptions = { ...defaultOptions, ...options };

        if (finalOptions.prefetchCount) {
            await this.channel.prefetch(finalOptions.prefetchCount);
        }

        await this.channel.consume(
            queueName,
            async (rawMessage: amqp.ConsumeMessage | null) => {
                if (!rawMessage) return;

                try {
                    const message: IQueues[T] = JSON.parse(rawMessage.content.toString());
                    await onMessage(message, rawMessage);

                    if (!finalOptions.noAck) {
                        this.channel?.ack(rawMessage);
                    }
                } catch (error) {
                    console.error(`Error processing message from queue "${queueName}":`, error);
                    if (!finalOptions.noAck) {
                        this.channel?.nack(rawMessage, false, true); // Requeue on error
                    }
                }
            },
            {
                noAck: finalOptions.noAck,
                exclusive: finalOptions.exclusive,
                consumerTag: finalOptions.consumerTag,
            }
        );
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

        this.assertedQueues.clear();
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
