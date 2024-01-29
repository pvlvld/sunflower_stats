import { IStats } from "../types/stats";
import YAMLWrapper from "./YAMLWrapper";

const Stats = new YAMLWrapper<IStats>(
  `database${new Date().toISOString().slice(0, 10)}`, // databaseYYYY-MM-DD.yaml
  "data/db"
);

Stats.load();

export default Stats;
