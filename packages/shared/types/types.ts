export interface IChartBaseTask {
    task_id: string; // chat_id:user_id
    chat_id: number;
    user_id: number;
    reply_to_message_id: number;
    thread_id: number;
}

export interface IChartStatsTask extends IChartBaseTask {
    target_id: number; // user_id or chat_id
    date_from: string;
    date_until: string;
    chat_premium: boolean;
    user_premium: boolean;

    // TODO: Refactor out these settings to handle them on the bot side to minimize data transfer
    usechatbgforall: boolean; // Use chat background for all charts
    line_color: string;
    font_color: string;
}

export interface IChartChatTopTask extends IChartBaseTask {}

export interface IChartBaseResult {
    task_id: string; // chat_id:user_id
    chat_id: number;
    reply_to_message_id: number;
    thread_id: number;
    error: string | null;
    raw: Buffer | null;
}

export interface IChartResult extends IChartBaseResult {
    format: IChartFormat;
}

export type IChartType = "user" | "chat" | "bot-all";
export type IChartFormat = "video" | "image";
