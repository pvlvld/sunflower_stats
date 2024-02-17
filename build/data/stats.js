"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLStats = void 0;
const YAMLWrapper_1 = __importDefault(require("./YAMLWrapper"));
class YAMLStats extends YAMLWrapper_1.default {
    dbPool;
    constructor(filename, dirrectory, dbPool) {
        super(filename, dirrectory);
        this.dbPool = dbPool;
    }
    writeStatsToDB() { }
}
exports.YAMLStats = YAMLStats;
exports.default = YAMLStats;
