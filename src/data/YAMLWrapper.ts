import fs from "fs";
import path from "path";
import bot from "../bot";
import * as YAML from "js-yaml";
import { isNodeError } from "../types/typeGuards";

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
      throw new Error("Dirrectory must contain only path to the file dirrectory.");
    }
    this.filename = filename;
    this.dirrectory = dirrectory;
    this.filepath = () => path.join(this.dirrectory, `${this.filename()}.yaml`);
    this.data = {} as T;
  }

  load() {
    try {
      this.data = YAML.load(fs.readFileSync(this.filepath(), "utf8"), {
        schema: YAML.JSON_SCHEMA,
      }) as T;
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${this.filepath()} not found. Starting new one.`);
        return;
      } else {
        throw e;
      }
    }
    console.log(`${this.filename()}.yaml loaded.`);
  }

  save(custom_filepath?: string) {
    try {
      fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${custom_filepath || this.filepath()} not found. Creating new one.`);

        fs.mkdirSync(this.dirrectory, { recursive: true });
        fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
      } else {
        throw new Error(e);
      }
    }
    console.log(`${custom_filepath || this.filename()} saved.`);
    bot.api.sendMessage("-1001898242958", `${custom_filepath || this.filename()} saved.`);
  }

  clear() {
    this.data = {} as T;
    bot.api.sendMessage("-1001898242958", `${this.filename()} cleared.`);
  }
}

export default YAMLWrapper;
