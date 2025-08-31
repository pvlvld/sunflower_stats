import moment from "moment";
import { active } from "../redis/active.js";
import { IGroupHearsCommandContext } from "../types/context.js";
import getUserNameLink from "../utils/getUserNameLink.js";
import { settingsService } from "../utils/settingsService.js";

async function oldUsers(ctx: IGroupHearsCommandContext) {
    const [oldUsers, chatSettings] = await Promise.all([
        getChatUsersOrderByFirstActive(ctx),
        settingsService.getChatSettings(ctx.chat.id),
    ]);
    if (oldUsers.length === 0) {
        return ctx.reply("No users found.");
    }

    let userList = "";
    for (let index = 0; index < oldUsers.length && index < 25; index++) {
        const user = oldUsers[index];
        console.log(user[1].active_first);
        if (chatSettings.userstatslink) {
            userList += `${index + 1}. ${getUserNameLink.html(user[1].name, user[1].username, user[0])} - ${
                user[1].active_first
            } (${moment(user[1].active_first).fromNow()})\n`;
        } else {
            userList += `${index + 1}. ${user[1].name} - ${user[1].active_first} (${moment(
                user[1].active_first
            ).fromNow()})\n`;
        }
    }
    userList = userList.trim();

    return ctx.reply(`Перелік олдів:\n${userList}`);
}

async function getChatUsersOrderByFirstActive(ctx: IGroupHearsCommandContext) {
    return Object.entries(await active.getChatUsers(ctx.chat.id)).sort((a, b) =>
        moment(a[1].active_first).diff(moment(b[1].active_first))
    );
}

export { oldUsers };
