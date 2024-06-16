import YAMLWrapper from "./YAMLWrapper";

export interface IActive {
  [chat_id: string | number]:
    | {
        [user_id: string | number]: IActiveUser | undefined;
      }
    | undefined;
}

export interface IActiveUser {
  active_first: string;
  active_last: string;
  name: string;
  nickname: string | undefined;
  username: string | undefined;
}

export const active = new YAMLWrapper<IActive>(() => "active", "data/active");

export default IActive;
