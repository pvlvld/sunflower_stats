import YAML from "yaml";
import fs from "fs";
import { isNodeError } from "../types/typeGuards";

interface IActive {
  [chat_id: string]:
    | {
        [user_id: string]:
          | {
              date: string;
              name: string;
            }
          | undefined;
      }
    | undefined;
}

class ActiveWrapper {
  readonly filename: string;
  private path: string;
  private filepath: string;
  public data!: IActive;

  constructor() {
    this.filename = "active.yaml";
    this.path = `data/active/`;
    this.filepath = this.path + this.filename;
    this.data = {};
  }

  load() {
    try {
      this.data = YAML.parse(fs.readFileSync(this.filepath, "utf8"));
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${this.filepath} not found. Starting new one.`);
        return;
      } else {
        throw e;
      }
    }
    console.log(`${this.filename} loaded.`);
  }

  save() {
    try {
      fs.writeFileSync(this.filepath, YAML.stringify(this.data));
    } catch (e: any) {
      if (isNodeError(e) && e.code === "ENOENT") {
        console.info(`${this.filepath} not found. Creating new one.`);

        fs.mkdirSync(this.path, { recursive: true });
        fs.writeFileSync(this.filepath, YAML.stringify(this.data));
      } else {
        throw new Error(e);
      }
    }
    console.log(`${this.filename} saved.`);
  }
}

const Active = new ActiveWrapper();

Active.load();

export default Active;
