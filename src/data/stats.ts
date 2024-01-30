import { IStats } from "../types/stats";
import { yyyy_mm_dd_date } from "../utils/date";
import YAMLWrapper from "./YAMLWrapper";

const Stats = new YAMLWrapper<IStats>(
  `database${yyyy_mm_dd_date()}`, // databaseYYYY-MM-DD.yaml
  "data/db"
);

Stats.load();

export default Stats;
