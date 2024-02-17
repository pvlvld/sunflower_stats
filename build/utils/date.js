"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormattedDate = void 0;
const moment_1 = __importDefault(require("moment"));
class FormattedDate {
    get today() {
        return (0, moment_1.default)().format("YYYY-MM-DD");
    }
    get yesterday() {
        return (0, moment_1.default)().subtract(1, "days").format("YYYY-MM-DD");
    }
    get weekRange() {
        return [
            (0, moment_1.default)().startOf("isoWeek").format("YYYY-MM-DD"),
            (0, moment_1.default)().endOf("isoWeek").format("YYYY-MM-DD"),
        ];
    }
    get monthRange() {
        return [
            (0, moment_1.default)().startOf("month").format("YYYY-MM-DD"),
            (0, moment_1.default)().endOf("month").format("YYYY-MM-DD"),
        ];
    }
    get yearRange() {
        const startOfYear = (0, moment_1.default)().startOf("year").format("YYYY-MM-DD");
        const endOfYear = (0, moment_1.default)().endOf("year").format("YYYY-MM-DD");
        return [startOfYear, endOfYear];
    }
}
exports.FormattedDate = FormattedDate;
const formattedDate = new FormattedDate();
exports.default = formattedDate;
