export type IStatsMessageTypes = {
  text: number;
  voice: number;
  sticker: number;
  file: number;
  video: number;
  gif: number;
  image: number;
  photo: number;
};

export interface IStats {
  [chat_id: string]:
    | {
        [user_id: string]:
          | ({
              name: string;
              username: string;
              day: number;
              week: number;
              month: number;
              all: number;
            } & IStatsMessageTypes)
          | undefined;
      }
    | undefined;
}
