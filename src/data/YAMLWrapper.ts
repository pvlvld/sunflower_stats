import YAML from "yaml";
import fs from "fs";
import { isNodeError } from "../types/typeGuards";
import path from "path";
import bot from "../bot";

//TODO: test case when clear insnantly after save & write instantly after load and verify wtired data in saved file
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
    this.filepath = () => path.join(this.dirrectory, `${this.filename()}.yaml`);
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
    console.log(`${this.filename()}.yaml loaded.`);
  }

  // Custom filepath to save, if not set then undefined
  save(custom_filepath?: string) {
    try {
      fs.writeFileSync(
        custom_filepath || this.filepath(),
        YAML.stringify(this.data)
      );
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(
          `${custom_filepath || this.filepath()} not found. Creating new one.`
        );

        fs.mkdirSync(this.dirrectory, { recursive: true });
        fs.writeFileSync(
          custom_filepath || this.filepath(),
          YAML.stringify(this.data)
        );
      } else {
        throw new Error(e);
      }
    }
    console.log(`${custom_filepath || this.filename()} saved.`);
    bot.api.sendMessage(
      "-1001898242958",
      `${custom_filepath || this.filename()} saved.`
    );
  }

  clear() {
    this.data = {} as T;
    bot.api.sendMessage("-1001898242958", `${this.filename()} cleared.`);
    if (global.gc) global.gc();
  }
}

export default YAMLWrapper;
