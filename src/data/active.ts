import YAMLWrapper from "./YAMLWrapper";

export interface IActive {
  [chat_id: string | number]:
    | {
        [user_id: string | number]:
          | {
              name?: string;
              username?: string | null;
              nickname?: string;
              active_last: string;
              active_first: string;
            }
          | undefined;
      }
    | undefined;
}

export const active = new YAMLWrapper<IActive>(() => "active", "data/active");

export default IActive;
