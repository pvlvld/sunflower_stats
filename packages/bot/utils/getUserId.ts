import { active } from "../redis/active.js";

/** Returns user_id or -1 on fail*/
async function getUserId(wantedUser: string | undefined, chat_id: number | string): Promise<number> {
    if (wantedUser === undefined) return -1;
    const users = await active.getChatUsers(+chat_id);
    if (wantedUser.startsWith("@")) {
        wantedUser = wantedUser.slice(1);
        for (const user in users) {
            if (users?.[user]?.username === wantedUser) {
                return +user;
            }
        }
        return -1;
    }

    if (isNaN(Number(wantedUser))) {
        for (const user in users) {
            if (users?.[user]?.name === wantedUser) {
                return +user;
            }
        }
        return -1;
    }

    if (users?.[wantedUser]) {
        return +wantedUser;
    }

    return -1;
}

export default getUserId;
