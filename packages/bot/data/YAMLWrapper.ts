// Memorial to the yaml based active storage system that was used in the past.

// import { isNodeError } from "../types/typeGuards.js";
// import * as YAML from "js-yaml";
// import cfg from "../config.js";
// import bot from "../bot.js";
// import path from "path";
// import fs from "fs";

// class YAMLWrapper<T> {
//     readonly filename: () => string;
//     readonly filepath: () => string;
//     readonly dirrectory: string;
//     public data!: T;

//     constructor(filename: () => string, dirrectory: string) {
//         if (filename().includes("/") || filename().includes(".")) {
//             throw new Error("Filename must be without path and file extension.");
//         }
//         if (dirrectory.includes(".")) {
//             throw new Error("Dirrectory must contain only path to the file dirrectory.");import { isNodeError } from "../types/typeGuards.js";
// import * as YAML from "js-yaml";
// import cfg from "../config.js";
// import bot from "../bot.js";
// import path from "path";
// import fs from "fs";

// class YAMLWrapper<T> {
//     readonly filename: () => string;
//     readonly filepath: () => string;
//     readonly dirrectory: string;
//     public data!: T;

//     constructor(filename: () => string, dirrectory: string) {
//         if (filename().includes("/") || filename().includes(".")) {
//             throw new Error("Filename must be without path and file extension.");
//         }
//         if (dirrectory.includes(".")) {
//             throw new Error("Dirrectory must contain only path to the file dirrectory.");
//         }
//         this.filename = filename;
//         this.dirrectory = dirrectory;
//         this.filepath = () => path.join(this.dirrectory, `${this.filename()}.yaml`);
//         this.data = {} as T;
//     }

//     load() {
//         try {
//             this.data = YAML.load(fs.readFileSync(this.filepath(), "utf8"), {
//                 schema: YAML.JSON_SCHEMA,
//             }) as T;
//         } catch (e: any) {
//             if (isNodeError(e) && e.code === "ENOENT") {
//                 console.info(`${this.filepath()} not found. Starting new one.`);
//                 return;
//             } else {
//                 throw e;
//             }
//         }
//         console.log(`${this.filename()}.yaml loaded.`);
//     }

//     async save(custom_filepath?: string) {
//         try {
//             fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
//         } catch (e: any) {
//             if (isNodeError(e) && e.code === "ENOENT") {
//                 console.info(`${custom_filepath || this.filepath()} not found. Creating new one.`);

//                 fs.mkdirSync(this.dirrectory, { recursive: true });
//                 fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
//             } else {
//                 throw new Error(e);
//             }
//         }
//         console.log(`${custom_filepath || this.filename()} saved.`);
//         bot.api.sendMessage(cfg.ANALYTICS_CHAT, `${custom_filepath || this.filename()} saved.`, {
//             message_thread_id: 3123,
//         });
//     }

//     clear() {
//         this.data = {} as T;
//         bot.api.sendMessage(cfg.ANALYTICS_CHAT, `${this.filename()} cleared.`, {
//             message_thread_id: 3123,
//         });
//     }
// }

// export default YAMLWrapper;

//         }
//         this.filename = filename;
//         this.dirrectory = dirrectory;
//         this.filepath = () => path.join(this.dirrectory, `${this.filename()}.yaml`);
//         this.data = {} as T;
//     }

//     load() {
//         try {
//             this.data = YAML.load(fs.readFileSync(this.filepath(), "utf8"), {
//                 schema: YAML.JSON_SCHEMA,
//             }) as T;
//         } catch (e: any) {
//             if (isNodeError(e) && e.code === "ENOENT") {
//                 console.info(`${this.filepath()} not found. Starting new one.`);
//                 return;
//             } else {
//                 throw e;
//             }
//         }
//         console.log(`${this.filename()}.yaml loaded.`);
//     }

//     async save(custom_filepath?: string) {
//         try {
//             fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
//         } catch (e: any) {
//             if (isNodeError(e) && e.code === "ENOENT") {
//                 console.info(`${custom_filepath || this.filepath()} not found. Creating new one.`);

//                 fs.mkdirSync(this.dirrectory, { recursive: true });
//                 fs.writeFileSync(custom_filepath || this.filepath(), YAML.dump(this.data));
//             } else {
//                 throw new Error(e);
//             }
//         }
//         console.log(`${custom_filepath || this.filename()} saved.`);
//         bot.api.sendMessage(cfg.ANALYTICS_CHAT, `${custom_filepath || this.filename()} saved.`, {
//             message_thread_id: 3123,
//         });
//     }

//     clear() {
//         this.data = {} as T;
//         bot.api.sendMessage(cfg.ANALYTICS_CHAT, `${this.filename()} cleared.`, {
//             message_thread_id: 3123,
//         });
//     }
// }

// export default YAMLWrapper;
