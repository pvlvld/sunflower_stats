export interface IActive {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              name: string | undefined;
              username: string | undefined;
              active_last: string;
              active_first: string;
            }
          | undefined;
      }
    | undefined;
}

export default IActive;
