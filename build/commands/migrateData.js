"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const YAMLWrapper_1 = __importDefault(require("../data/YAMLWrapper"));
const date_1 = __importDefault(require("../utils/date"));
const yaml_1 = __importDefault(require("yaml"));
function migrateData(ctx) {
    mergeActive(ctx);
    clearActive(ctx);
}
function clearActive(ctx) {
    const old_stats = new YAMLWrapper_1.default(() => "database", "data");
    old_stats.load();
    console.log("Loaded database.yaml");
    const new_stats = {};
    for (const chat_id in old_stats.data) {
        for (const user_id in old_stats.data[chat_id]) {
            if (chat_id == user_id)
                continue;
            new_stats[chat_id] ??= {};
            new_stats[chat_id][user_id] = old_stats.data[chat_id][user_id].day;
        }
    }
    old_stats.clear();
    fs_1.default.writeFileSync("data/stats/stats.yaml", yaml_1.default.stringify(new_stats));
    console.log("Stats Done");
    ctx.reply("Stats ✅ Done");
}
function mergeActive(ctx) {
    let old_first_seen = JSON.parse(fs_1.default.readFileSync("data/ggg.json").toString());
    const old_active = new YAMLWrapper_1.default(() => "active", "data");
    old_active.load();
    console.log("Loaded active.json");
    let mergedActive = {};
    for (const chat in old_first_seen) {
        for (const user in old_first_seen[chat]) {
            if (chat == user)
                continue;
            const active_last = old_active.data[chat]?.[user]?.date ||
                date_1.default.today;
            if (active_last.startsWith("2023"))
                continue;
            mergedActive[chat] ??= {};
            mergedActive[chat][user] = {
                name: old_active.data[chat]?.[user]?.name !== undefined
                    ? replaceUnicodeCodes(String(old_active.data[chat]?.[user]?.name))
                    : undefined,
                active_last,
                active_first: old_first_seen[chat]?.[user] || date_1.default.today,
            };
        }
    }
    fs_1.default.writeFileSync("data/active/active.yaml", yaml_1.default.stringify(mergedActive));
    console.log("Aсtive Done");
    ctx.reply("Aсtive ✅ Done");
    old_active.clear();
    old_first_seen = undefined;
}
function replaceUnicodeCodes(text) {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
    });
}
exports.default = migrateData;
