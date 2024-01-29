import { IStatsMessageTypes } from "../types/stats";
import YAMLWrapper from "./YAMLWrapper";

interface IStats {
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

const Stats = new YAMLWrapper<IStats>(
  `database${new Date().toISOString().slice(0, 10)}`, // databaseYYYY-MM-DD.yaml
  "data/db"
);

Stats.load();

export default Stats;
