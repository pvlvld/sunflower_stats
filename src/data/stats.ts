import { IStats } from "../types/stats";
import formattedDate from "../utils/date";
import YAMLWrapper from "./YAMLWrapper";

class YAMLStats extends YAMLWrapper<IStats> {
  db: any;

  constructor(filename: () => string, dirrectory: string, db: any) {
    super(filename, dirrectory);
    this.db = db;
  }

  writeStatsToDB() {}
}

const Stats = new YAMLStats(
  () => `database${formattedDate.today}`, // databaseYYYY-MM-DD.yaml
  "data/db",
  undefined
);

export default Stats;
