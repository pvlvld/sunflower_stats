import YAMLWrapper from "./YAMLWrapper";

export interface IActive {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              active_last: string;
              active_first: string;
              name: string;
            }
          | undefined;
      }
    | undefined;
}

export default IActive;
