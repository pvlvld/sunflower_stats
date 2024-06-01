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

export interface IDBChatUserStats {
  user_id: number;
  count: number;
}
