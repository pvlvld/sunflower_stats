import fs from "fs";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import { MyContext } from "../types/context";
import formattedDate from "../utils/date";
import YAML from "yaml";

/** Merge active.yaml with first_active.json, fix unicode and save to active.yaml */
function mergeActive_cmd(active: YAMLWrapper<IActive>, ctx: MyContext) {
  const firstActiveData = JSON.parse(
    fs.readFileSync("data/first_active.json").toString()
  );
  console.log("Loaded last_active.json");

  let mergedActive = {} as any;
  for (const chat in active.data) {
    for (const user in active.data[chat]) {
      if (chat == user) continue;

      if (mergedActive[chat]) {
        mergedActive[chat][user] = {
          name: replaceUnicodeCodes(active.data[chat]?.[user]?.name || "-"),
          //@ts-ignore
          active_last: active.data[chat]?.[user]?.date,
          active_first: firstActiveData[chat]?.[user] || formattedDate.today,
        };
      } else {
        if (chat == user) continue;
        mergedActive[chat] = {
          [user]: {
            name: replaceUnicodeCodes(active.data[chat]?.[user]?.name || "-"),
            //@ts-ignore
            active_last: active.data[chat]?.[user]?.date,
            active_first: firstActiveData[chat]?.[user] || formattedDate.today,
          },
        };
      }
    }
  }

  fs.writeFileSync("data/active/active.yaml", YAML.stringify(mergedActive));
  console.log("Done");
  ctx.reply("✅ Done");
}

function replaceUnicodeCodes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}

export default mergeActive_cmd;
