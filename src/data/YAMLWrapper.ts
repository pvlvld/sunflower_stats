import YAML from "yaml";
import fs from "fs";
import { isNodeError } from "../types/typeGuards";
import path from "path";

class YAMLWrapper<T> {
  readonly filename: () => string;
  readonly filepath: () => string;
  readonly dirrectory: string;
  public data!: T;

  constructor(filename: () => string, dirrectory: string) {
    if (filename().includes("/") || filename().includes(".")) {
      throw new Error("Filename must be without path and file extension.");
    }
    if (dirrectory.includes(".")) {
      throw new Error(
        "Dirrectory must contain only path to the file dirrectory."
      );
    }
    this.filename = filename;
    this.dirrectory = dirrectory;
    this.filepath = () => path.join(this.dirrectory, this.filename());
    this.data = {} as T;
  }

  load() {
    try {
      this.data = YAML.parse(fs.readFileSync(this.filepath(), "utf8"));
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${this.filepath()} not found. Starting new one.`);
        return;
      } else {
        throw e;
      }
    }
    console.log(`${this.filename} loaded.`);
  }

  save() {
    try {
      fs.writeFileSync(this.filepath(), YAML.stringify(this.data));
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${this.filepath()} not found. Creating new one.`);

        fs.mkdirSync(this.dirrectory, { recursive: true });
        fs.writeFileSync(this.filepath(), YAML.stringify(this.data));
      } else {
        throw new Error(e);
      }
    }
    console.log(`${this.filename} saved.`);
  }

  clear() {
    this.data = {} as T;
    if (global.gc) global.gc();
  }
}

export default YAMLWrapper;
