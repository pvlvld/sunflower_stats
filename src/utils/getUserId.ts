import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

//** Returns user_id or -1 on fail*/
function getUserId(
  wantedUser: string | undefined,
  chat_id: number | string,
  active: YAMLWrapper<IActive>
) {
  if (wantedUser === undefined) return -1;
  if (wantedUser.startsWith("@")) {
    wantedUser = wantedUser.slice(1);
    for (const user in active.data[chat_id]) {
      if (active.data[chat_id]?.[user]?.username === wantedUser) {
        return +user;
      }
    }
    return -1;
  }

  if (isNaN(Number(wantedUser))) {
    for (const user in active.data[chat_id]) {
      if (active.data[chat_id]?.[user]?.name === wantedUser) {
        return +user;
      }
    }
    return -1;
  }

  return -1;
}

export default getUserId;
