import YAMLWrapper from "./YAMLWrapper";

interface IActive {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              date: string;
              name: string;
            }
          | undefined;
      }
    | undefined;
}

const Active = new YAMLWrapper<IActive>("active", "data/active");

Active.load();

export default Active;
