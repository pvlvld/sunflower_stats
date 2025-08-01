export interface IChartTask {
    taskId: string; // chat_id:user_id
    target_id: number; // user_id or chat_id
    chat_id: number;
    user_id: number;
    reply_to_message_id: number;
    thread_id: number;
    date_from: string;
    date_until: string;
    chat_premium: boolean;
    user_premium: boolean;
}

export interface IChartResult {
    taskId: string; // chat_id:user_id
    error: string | null;
    raw: Buffer | null;
    format: "video" | "image";
}

export type IChartType = "user" | "chat" | "bot-all";
export type IChartFormat = "video" | "image";
