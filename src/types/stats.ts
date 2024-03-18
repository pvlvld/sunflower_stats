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

export interface IDbChatUserStatsPeriods {
  total: number;
  year: number;
  month: string;
  week: string;
  today: string;
}

export interface IDbChatUserStats {
  user_id: number;
  count: number;
}
