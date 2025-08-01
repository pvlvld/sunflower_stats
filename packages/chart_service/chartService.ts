import { IChartTask } from "@sunflower-stats/shared/index.js";
import { RabbitMQClient } from "@sunflower-stats/shared/rabbitmq/rabbitmqClient.js";
import { ConsumeMessage } from "amqplib";
import { getStatsChart } from "getStatsChart.js";

export class ChartService {
    constructor(private readonly rabbitMQClient: RabbitMQClient = RabbitMQClient.getInstance()) {}
    private isProcessing: boolean = false;
    private isStopping: boolean = false;
    async start() {
        await this.rabbitMQClient.consumeChartTasks(this.handleChartTask.bind(this));
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

    private async handleChartTask(task: IChartTask, message: ConsumeMessage | null): Promise<void> {
        this.isProcessing = true;
        if (this.isStopping) {
            console.warn("ChartService is stopping, skipping task processing.");
            return;
        }
        console.log(`Processing chart task with ID: ${task.task_id}`);

        const chart = await getStatsChart(task);

        if (!chart) {
            await this.rabbitMQClient.sendChartResult({
                task_id: task.task_id,
                chat_id: task.chat_id,
                reply_to_message_id: task.reply_to_message_id,
                thread_id: task.thread_id,
                raw: null,
                format: "image",
                error: "Failed to generate chart",
            });
            this.isProcessing = false;
            return;
        }

        await this.rabbitMQClient.sendChartResult({
            task_id: task.task_id,
            chat_id: task.chat_id,
            reply_to_message_id: task.reply_to_message_id,
            thread_id: task.thread_id,
            raw: chart.chart,
            format: chart.chartFormat,

            error: null,
        });
        this.isProcessing = false;
    }
}
