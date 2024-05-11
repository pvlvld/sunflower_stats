import YAMLWrapper from "./YAMLWrapper";

export interface IActive {
  [chat_id: string | number]:
    | {
        [user_id: string | number]:
          | {
              active_first: string;
              active_last: string;
              name: string;
              nickname: string | null;
              username: string | null;
            }
          | undefined;
      }
    | undefined;
}

export const active = new YAMLWrapper<IActive>(() => "active", "data/active");

export default IActive;
