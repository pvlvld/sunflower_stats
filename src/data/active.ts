export interface IActive {
  [chat_id: string | number]:
    | {
        [user_id: string | number]:
          | {
              name?: string;
              username?: string;
              active_last: string;
              active_first: string;
            }
          | undefined;
      }
    | undefined;
}

export default IActive;
