import { IStats } from "../types/stats";
import formattedDate from "../utils/date";
import YAMLWrapper from "./YAMLWrapper";
import mysql2 from "mysql2/promise";

export class YAMLStats extends YAMLWrapper<IStats> {
  dbPool: mysql2.Pool;
  constructor(filename: () => string, dirrectory: string, dbPool: mysql2.Pool) {
    super(filename, dirrectory);
    this.dbPool = dbPool;
  }

  writeStatsToDB() {}
}

const yamlStats = new YAMLStats(
  () => `database${formattedDate.today}`, // databaseYYYY-MM-DD.yaml
  "data/db",
  undefined
);

export default yamlStats;
