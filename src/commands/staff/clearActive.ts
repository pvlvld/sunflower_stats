import type { IGroupHearsContext } from "../../types/context.js";
import { active } from "../../redis/active.js";
import parseCmdArgs from "../../utils/parseCmdArgs.js";

async function clearOldBotActive(ctx: IGroupHearsContext) {
    let chat: number;
    let user: string;
    let today = new Date();
    let last_active = today;
    let chats_count = 0;
    let inactive_count = 0;
    let users_count = 0;
    const chats = await active.getAllChatIds();
    let users: Awaited<ReturnType<typeof active.getChatUsers>>;
    for (chat of chats) {
        users = await active.getChatUsers(chat);
        inactive_count = 0;
        users_count = users ? Object.keys(users).length : 0;
        if (users_count === 0) {
            active.removeChat(chat);
            chats_count++;
            continue;
        }
        for (user in users) {
            last_active = new Date(users[user].active_last);
            if (daysBetween(last_active, today) > 30) {
                inactive_count++;
            }
            if (inactive_count === users_count) {
                active.removeChat(chat);
                chats_count++;
            }
        }
    }
    const logMsg = `Видалено ${chats_count} чатів з активу`;
    console.info(logMsg);
    void ctx.reply(logMsg).catch((e) => {});
}

function daysBetween(date1: Date, date2: Date): number {
    const differenceInTime = date2.getTime() - date1.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return Math.abs(differenceInDays);
}

async function clearGroupActive(ctx: IGroupHearsContext, users: Awaited<ReturnType<typeof active.getChatUsers>>) {
    const cmdArguments = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);
    if (cmdArguments.length !== 2) {
        return void (await ctx.reply("Недостатньо аргументів").catch((e) => {}));
    }

    const chat = cmdArguments[0]!;
    const days = Number(cmdArguments[1]!);
    const today = new Date();
    let count = 0;

    if (Number(chat) > 0) {
        return void (await ctx.reply("Неправильний аргумент чату").catch((e) => {}));
    }

    if (isNaN(days)) {
        return void (await ctx.reply("Неправильний аргумент днів").catch((e) => {}));
    }

    for (const user in users) {
        if (daysBetween(new Date(users[user].active_last), today) < days) continue;
        active.removeUser(+chat, +user);
        count++;
    }

    await ctx.reply(`Видалено ${count} користувачів з активу.`).catch((e) => {});
}

export { clearOldBotActive, clearGroupActive };
