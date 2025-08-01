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

    // TODO: Refactor out these settings to handle them on the bot side to minimize data transfer
    usechatbgforall: boolean; // Use chat background for all charts
    chat_line: string; // Color of the chat line
    user_line: string; // Color of the user line
    chat_font: string; // Font color for the chat
    user_font: string; // Font color for the user
}

export interface IChartResult {
    taskId: string; // chat_id:user_id
    chat_id: number;
    reply_to_message_id: number;
    thread_id: number;
    error: string | null;
    raw: Buffer | null;
    format: "video" | "image";
}

export type IChartType = "user" | "chat" | "bot-all";
export type IChartFormat = "video" | "image";
