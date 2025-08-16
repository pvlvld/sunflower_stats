// import { RabbitMQClient } from "./rabbitmqClient.js";
// import type { IChartResult } from "../types/types.js";
// import type { ConsumeMessage } from "amqplib";

// export class ChartResultsConsumer {
//     private rabbitMQClient: RabbitMQClient;

//     constructor(rabbitMQClient?: RabbitMQClient) {
//         this.rabbitMQClient = rabbitMQClient || RabbitMQClient.getInstance();
//     }

//     /**
//      * Initialize the consumer by asserting the queue
//      */
//     public async initialize(): Promise<void> {
//         await this.rabbitMQClient.assertQueue("chart_results", {
//             durable: true,
//             autoDelete: false,
//         });
//     }

//     /**
//      * Start consuming chart results
//      * @param onResult Callback function to handle the result
//      * @param prefetchCount Number of unacknowledged messages that a consumer can handle
//      */
//     public async startConsuming(
//         onResult: (result: IChartResult, message: ConsumeMessage | null) => void | Promise<void>,
//         prefetchCount: number = 1
//     ): Promise<void> {
//         await this.rabbitMQClient.consume("chart_results", onResult, {
//             prefetchCount,
//         });
//     }
// }
