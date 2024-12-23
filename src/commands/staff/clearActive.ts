import type { IGroupHearsContext } from "../../types/context.js";
import { active } from "../../data/active.js";
import parseCmdArgs from "../../utils/parseCmdArgs.js";

async function clearOldBotActive(ctx: IGroupHearsContext) {
    let chat: string;
    let user: string;
    let today = new Date();
    let last_active = today;
    let count = 0;
    for (chat in active.data) {
        for (user in active.data[chat]) {
            last_active = new Date(active.data[chat]![user]!.active_last);
            if (daysBetween(last_active, today) > 30) {
                delete active.data[chat];
                count++;
                break;
            }
        }
    }

    const logMsg = `Видалено ${count} чатів з активу`;
    console.info(logMsg);
    void ctx.reply(logMsg).catch((e) => {});
}

function daysBetween(date1: Date, date2: Date): number {
    const differenceInTime = date2.getTime() - date1.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return Math.abs(differenceInDays);
}

async function clearGroupActive(ctx: IGroupHearsContext) {
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

    for (const user in active.data[chat]) {
        if (daysBetween(new Date(active.data[chat][user]!.active_last), today) < days) continue;
        delete active.data[chat][user];
        count++;
    }

    await ctx.reply(`Видалено ${count} користувачів з активу.`).catch((e) => {});
}

export { clearOldBotActive, clearGroupActive };
