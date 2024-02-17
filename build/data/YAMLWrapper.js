"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_1 = __importDefault(require("yaml"));
const fs_1 = __importDefault(require("fs"));
const typeGuards_1 = require("../types/typeGuards");
const path_1 = __importDefault(require("path"));
const bot_1 = __importDefault(require("../bot"));
class YAMLWrapper {
    filename;
    filepath;
    dirrectory;
    data;
    constructor(filename, dirrectory) {
        if (filename().includes("/") || filename().includes(".")) {
            throw new Error("Filename must be without path and file extension.");
        }
        if (dirrectory.includes(".")) {
            throw new Error("Dirrectory must contain only path to the file dirrectory.");
        }
        this.filename = filename;
        this.dirrectory = dirrectory;
        this.filepath = () => path_1.default.join(this.dirrectory, `${this.filename()}.yaml`);
        this.data = {};
    }
    load() {
        try {
            this.data = yaml_1.default.parse(fs_1.default.readFileSync(this.filepath(), "utf8"));
        }
        catch (e) {
            if ((0, typeGuards_1.isNodeError)(e) && e.code === "ENOENT") {
                console.info(`${this.filepath()} not found. Starting new one.`);
                return;
            }
            else {
                throw e;
            }
        }
        console.log(`${this.filename()}.yaml loaded.`);
    }
    save(custom_filepath) {
        try {
            fs_1.default.writeFileSync(custom_filepath || this.filepath(), yaml_1.default.stringify(this.data));
        }
        catch (e) {
            if ((0, typeGuards_1.isNodeError)(e) && e.code === "ENOENT") {
                console.info(`${custom_filepath || this.filepath()} not found. Creating new one.`);
                fs_1.default.mkdirSync(this.dirrectory, { recursive: true });
                fs_1.default.writeFileSync(custom_filepath || this.filepath(), yaml_1.default.stringify(this.data));
            }
            else {
                throw new Error(e);
            }
        }
        console.log(`${custom_filepath || this.filename()} saved.`);
        bot_1.default.api.sendMessage("-1001898242958", `${custom_filepath || this.filename()} saved.`);
    }
    clear() {
        this.data = {};
        bot_1.default.api.sendMessage("-1001898242958", `${this.filename()} cleared.`);
        if (global.gc)
            global.gc();
    }
}
exports.default = YAMLWrapper;
