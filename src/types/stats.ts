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

export interface IUserDbStats {
  total: number;
  year: number;
  month: string;
  week: string;
}
