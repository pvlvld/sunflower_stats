// import { RabbitMQClient } from "./rabbitmqClient.js";
// import type { IChartStatsTask } from "../types/types.js";
// import type { ConsumeMessage } from "amqplib";

// export class ChartStatsTaskConsumer {
//     private rabbitMQClient: RabbitMQClient;

//     constructor(rabbitMQClient?: RabbitMQClient) {
//         this.rabbitMQClient = rabbitMQClient || RabbitMQClient.getInstance();
//     }

//     /**
//      * Initialize the consumer by asserting the queue
//      */
//     public async initialize(): Promise<void> {
//         await this.rabbitMQClient.assertQueue("chart_stats_tasks", {
//             durable: true,
//             autoDelete: false,
//             maxPriority: 1,
//         });
//     }

//     /**
//      * Start consuming chart tasks
//      * @param onTask Callback function to handle the task
//      * @param prefetchCount Number of unacknowledged messages that a consumer can handle
//      */
//     public async startConsuming(
//         onTask: (task: IChartStatsTask, message: ConsumeMessage | null) => void | Promise<void>,
//         prefetchCount: number = 1
//     ): Promise<void> {
//         await this.rabbitMQClient.consume("chart_stats_tasks", onTask, {
//             prefetchCount,
//         });
//     }
// }
