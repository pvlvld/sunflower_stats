import { IStats } from "../types/stats";
import formattedDate from "../utils/date";
import YAMLWrapper from "./YAMLWrapper";

export class YAMLStats extends YAMLWrapper<IStats> {
  db: any;

  constructor(filename: () => string, dirrectory: string, db: any) {
    super(filename, dirrectory);
    this.db = db;
  }

  writeStatsToDB() {}
}

const yamlStats = new YAMLStats(
  () => `database${formattedDate.today}`, // databaseYYYY-MM-DD.yaml
  "data/db",
  undefined
);

export default yamlStats;
