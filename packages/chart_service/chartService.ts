import type { IChartStatsTask } from "@sunflower-stats/shared";
import { RabbitMQClient } from "@sunflower-stats/shared";
import { ConsumeMessage } from "amqplib";
import { getStatsChart } from "./getStatsChart.js";
import { config } from "./consts/config.js";

export class ChartService {
    constructor(
        private readonly rabbitMQClient: RabbitMQClient = RabbitMQClient.getInstance(
            config.RABBITMQ_USER,
            config.RABBITMQ_PASSWORD
        )
    ) {}
    private isProcessing: boolean = false;
    private isStopping: boolean = false;
    async start() {
        await this.rabbitMQClient.assertQueue("chart_stats_tasks", {
            durable: true,
            autoDelete: false,
            arguments: {
                "x-max-priority": 1,
            },
        });
        await this.rabbitMQClient.assertQueue("chart_stats_results", {
            durable: true,
            autoDelete: false,
        });
        await this.rabbitMQClient.consume("chart_stats_tasks", this.handleChartTask.bind(this));
    }

    async stop() {
        this.isStopping = true;
        if (this.isStopping) {
            console.warn("ChartService is already stopping.");
            return;
        }

        while (this.isProcessing) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        await this.rabbitMQClient.close();
    }

    private async handleChartTask(task: IChartStatsTask, message: ConsumeMessage | null): Promise<void> {
        this.isProcessing = true;
        if (this.isStopping) {
            console.warn("ChartService is stopping, skipping task processing.");
            return;
        }
        console.log(`Processing chart task with ID: ${task.task_id}`);

        const chart = await getStatsChart(task);

        if (!chart) {
            await this.rabbitMQClient.produce(
                "chart_stats_results",
                {
                    task_id: task.task_id,
                    chat_id: task.chat_id,
                    target_id: task.target_id,
                    reply_to_message_id: task.reply_to_message_id,
                    thread_id: task.thread_id,
                    date_range: task.date_range,
                    raw: null,
                    format: "image",
                    error: "Failed to generate chart",
                },
                {
                    priority: +(task.chat_premium || task.user_premium),
                }
            );
            this.isProcessing = false;
            return;
        }

        await this.rabbitMQClient.produce(
            "chart_stats_results",
            {
                task_id: task.task_id,
                chat_id: task.chat_id,
                target_id: task.target_id,
                reply_to_message_id: task.reply_to_message_id,
                thread_id: task.thread_id,
                date_range: task.date_range,
                raw: chart.chart,
                format: chart.chartFormat,

                error: null,
            },
            {
                priority: +(task.chat_premium || task.user_premium),
            }
        );
        this.isProcessing = false;
    }
}
