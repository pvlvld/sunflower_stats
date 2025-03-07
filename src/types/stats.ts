// export type IStatsMessageTypes = {
//   text: number;
//   voice: number;
//   sticker: number;
//   file: number;
//   video: number;
//   gif: number;
//   image: number;
//   photo: number;
// };

export interface IStats {
    [chat_id: string | number]:
        | {
              [user_id: string | number]: number | undefined;
          }
        | undefined;
}

export interface IDBChatUserStatsPeriods {
    total: number;
    year: number;
    month: number;
    week: number;
    today: number;
}

export type IDBChatUserStatsAll = IDBChatUserStatsPeriods & { first_seen: string };

export interface IDBChatUserStats {
    user_id: number;
    count: number;
}

export interface IDBChatUserStatsAndTotal extends IDBChatUserStats {
    total_count: number;
}

export interface IDBUserTopChats {
    chat_id: number;
    title: string;
    chat_count: number;
    total_count: number;
}
