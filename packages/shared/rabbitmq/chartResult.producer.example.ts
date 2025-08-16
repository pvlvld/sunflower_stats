// import { RabbitMQClient } from "./rabbitmqClient.js";
// import type { IChartResult } from "../types/types.js";

// export class ChartResultsProducer {
//     private rabbitMQClient: RabbitMQClient;

//     constructor(rabbitMQClient?: RabbitMQClient) {
//         this.rabbitMQClient = rabbitMQClient || RabbitMQClient.getInstance();
//     }

//     /**
//      * Initialize the producer by asserting the queue
//      */
//     public async initialize(): Promise<void> {
//         await this.rabbitMQClient.assertQueue("chart_results", {
//             durable: true,
//             autoDelete: false,
//         });
//     }

//     /**
//      * Send chart rendering result back to the results queue
//      */
//     public async sendResult(result: IChartResult): Promise<boolean> {
//         return await this.rabbitMQClient.produce("chart_results", result, {
//             persistent: true,
//         });
//     }
// }
