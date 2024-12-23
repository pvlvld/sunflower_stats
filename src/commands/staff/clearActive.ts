import type { IGroupHearsContext } from "../../types/context.js";
import { active } from "../../data/active.js";

async function clearActive(ctx: IGroupHearsContext) {
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

export { clearActive };
