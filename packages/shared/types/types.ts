export type IDateRange = "weekRange" | "monthRange" | "yearRange" | "all";

export interface IChartBaseTask {
    task_id: string; // chat_id:user_id
    chat_id: number;
    user_id: number;
    reply_to_message_id: number;
    thread_id: number;
}

// TODO: bruh
export interface IChartStatsTask extends IChartBaseTask {
    target_id: number; // user_id or chat_id
    /**
     * Dates are in the 'YYYY-MM-DD' format
     *
     * [date_from, date_until, date_range_name for chats]
     */
    date_range: [string, string, IDateRange];
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
    date_range: [string, string, IDateRange];
    error: string | null;
    raw: Buffer | null;
}

export interface IChartResult extends IChartBaseResult {
    format: IChartFormat;
}

export type IChartType = "user" | "chat" | "bot-all";
export type IChartFormat = "video" | "image";
