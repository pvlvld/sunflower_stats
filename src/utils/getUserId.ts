import { HearsContext } from "grammy";
import { MyContext } from "../types/context";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import parseCmdArgs from "./parseCmdArgs";

//** Returns user_id or -1 on fail*/
function getUserId(ctx: HearsContext<MyContext>, active: YAMLWrapper<IActive>) {
  let wantedUser = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption)[0];

  if (wantedUser.startsWith("@")) {
    wantedUser = wantedUser.slice(1);
    for (const user in active.data[ctx.chat.id]) {
      if (active.data[ctx.chat.id]?.[user]?.username === wantedUser) {
        return +user;
      }
    }
    return -1;
  }

  if (isNaN(Number(wantedUser))) {
    for (const user in active.data[ctx.chat.id]) {
      if (active.data[ctx.chat.id]?.[user]?.name === wantedUser) {
        return +user;
      }
    }
    return -1;
  }

  return -1;
}

export default getUserId;
