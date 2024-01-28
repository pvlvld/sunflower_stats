import YAMLWrapper from "./YAMLWrapper";

// TODO: add all fields to the type
interface IStats {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              name: string;
              username: string;
              text: number;
              image: number;
              day: number;
              week: number;
              month: number;
              all: number;
            }
          | undefined;
      }
    | undefined;
}

const Stats = new YAMLWrapper<IStats>(
  `database${new Date().toISOString().slice(0, 10)}`, // databaseYYYY-MM-DD.yaml
  "data/db"
);

Stats.load();

export default Stats;
