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
  [chat_id: string]:
    | {
        [user_id: string]: number | undefined;
      }
    | undefined;
}

export interface IDbChatUserStatsPeriods {
  total: number;
  year: number;
  month: string;
  week: string;
}

export interface IDbChatUsersStats {
  user_id: number;
  count: number;
  name: string;
  username: string;
}
[];
