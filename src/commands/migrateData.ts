import fs from "fs";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { MyContext } from "../types/context";
import formattedDate from "../utils/date";
import YAML from "yaml";
import { IStats } from "../types/stats";

function migrateData(ctx: MyContext) {
  mergeActive(ctx);
  clearActive(ctx);
}

function clearActive(ctx: MyContext) {
  const old_stats = new YAMLWrapper<any>(() => "database", "data");
  old_stats.load();
  console.log("Loaded database.yaml");

  const new_stats = {} as IStats;

  for (const chat_id in old_stats.data) {
    for (const user_id in old_stats.data[chat_id]) {
      if (chat_id == user_id) continue;

      new_stats[chat_id] ??= {};
      //@ts-expect-error
      new_stats[chat_id][user_id] = old_stats.data[chat_id][user_id].day;
    }
  }
  old_stats.clear();

  fs.writeFileSync("data/stats/stats.yaml", YAML.stringify(new_stats));

  console.log("Stats Done");
  ctx.reply("Stats ✅ Done");
}

/** Merge active.yaml with first_active.json, fix unicode and save to active.yaml */
function mergeActive(ctx: MyContext) {
  let old_first_seen = JSON.parse(fs.readFileSync("data/ggg.json").toString());

  const old_active = new YAMLWrapper<any>(() => "active", "data");
  old_active.load();
  console.log("Loaded active.json");

  let mergedActive = {} as IActive;

  for (const chat in old_first_seen) {
    for (const user in old_first_seen[chat]) {
      if (chat == user) continue;
      if (!old_active.data[chat]?.[user]?.name) continue;
      const active_last =
        (old_active.data[chat]?.[user]?.date as string | undefined) ||
        formattedDate.today;
      if (active_last.startsWith("2023")) continue;

      mergedActive[chat] ??= {};
      //@ts-expect-error
      mergedActive[chat][user] = {
        name:
          old_active.data[chat]?.[user]?.name !== undefined
            ? replaceUnicodeCodes(String(old_active.data[chat]?.[user]?.name))
            : undefined,
        active_last,
        active_first: old_first_seen[chat]?.[user] || formattedDate.today,
      };
    }
  }

  fs.writeFileSync("data/active/active.yaml", YAML.stringify(mergedActive));

  console.log("Aсtive Done");
  ctx.reply("Aсtive ✅ Done");

  old_active.clear();
  old_first_seen = undefined;
}

function replaceUnicodeCodes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}

export default migrateData;
