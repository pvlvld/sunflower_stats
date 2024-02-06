import YAMLWrapper from "./YAMLWrapper";

export interface IActive {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              last_time: string;
              first_time: string;
              name: string;
            }
          | undefined;
      }
    | undefined;
}

const Active = new YAMLWrapper<IActive>(() => "active", "data/active");

export default Active;
