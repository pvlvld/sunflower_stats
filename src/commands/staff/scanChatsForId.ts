import type { IGroupHearsContext } from "../../types/context.js";
import { DBPoolManager } from "../../db/poolManager.js";
import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../data/active.js";
import { GrammyError, InputFile } from "grammy";
import moment from "moment";
import { writeFileSync } from "node:fs";
import path from "node:path";

async function scanChatsForId(ctx: IGroupHearsContext): Promise<void> {
    const target = parseInt(ctx.message.text!.split(" ")[1]);
    if (!target) {
        return;
    }

    ctx.api.config.use(autoRetry());

    const chats: string[] = [];
    for (let chat in active.data) {
        if (!chat.startsWith("-")) {
            continue;
        }

        for (let user in active.data[chat]) {
            if (moment().diff(moment(active.data[chat][user]!.active_last), "days") < 5) {
                try {
                    const test = await ctx.api.getChatMember(chat, target);
                    if (!test || !test.status) break;
                    if (test.status === "kicked") break;
                    if (test.status === "left") break;
                    chats.push(chat);
                } catch (e) {
                    console.error(e);
                    if (e instanceof GrammyError && e.description.includes("bot was kicked")) {
                        void DBPoolManager.getPoolWrite
                            .query(`UPDATE chats SET stats_bot_in = false WHERE chat_id = ${chat};`)
                            .catch((e) => {});
                        delete active.data[chat];
                    }
                    if (e instanceof GrammyError && e.description.includes("chat not found")) {
                        delete active.data[chat];
                    }
                    break;
                }
            }
        }
    }

    console.info(`Знайдено ${chats.length} чатів, де є користувач з ID ${target}.`);
    if (chats.length > 0) {
        const file = path.resolve(`./data/chats_with_${target}.txt`);
        console.log(file);
        writeFileSync(file, chats.join(","));
        await ctx
            .replyWithDocument(new InputFile(file), {
                caption: `Знайдено ${chats.length} чатів, де є користувач з ID ${target}.`,
            })
            .catch((e) => {});
    } else {
        void (await ctx.reply(`нема 🤷‍♀️`).catch((e) => {}));
    }
}

export { scanChatsForId };
