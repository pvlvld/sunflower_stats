// import { RabbitMQClient } from "./rabbitmqClient.js";
// import type { IChartStatsTask } from "../types/types.js";

// export class ChartStatsTaskProducer {
//     private rabbitMQClient: RabbitMQClient;

//     constructor(rabbitMQClient?: RabbitMQClient) {
//         this.rabbitMQClient = rabbitMQClient || RabbitMQClient.getInstance();
//     }

//     /**
//      * Initialize the producer by asserting the queue
//      */
//     public async initialize(): Promise<void> {
//         await this.rabbitMQClient.assertQueue("chart_stats_tasks", {
//             durable: true,
//             autoDelete: false,
//             maxPriority: 1,
//         });
//     }

//     /**
//      * Generate a task ID
//      * Returns a string in the format "chat_id:user_id" to uniquely identify a task.
//      */
//     public generateTaskId(task: IChartStatsTask): string {
//         return `${task.chat_id}:${task.user_id}`;
//     }

//     /**
//      * Send a chart rendering task to the queue
//      * Returns the taskId for correlation
//      */
//     public async sendTask(task: IChartStatsTask, priority: 0 | 1 = 0): Promise<string> {
//         if (!task.task_id) {
//             task.task_id = this.generateTaskId(task);
//         }

//         await this.rabbitMQClient.produce("chart_stats_tasks", task, {
//             persistent: true,
//             priority,
//         });

//         return task.task_id;
//     }
// }
