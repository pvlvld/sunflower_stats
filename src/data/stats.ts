import { IStats } from "../types/stats";
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

export default YAMLStats;
