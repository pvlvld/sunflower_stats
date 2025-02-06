import type { IGroupHearsContext } from "../../types/context.js";
import { DBPoolManager } from "../../db/poolManager.js";
import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../data/active.js";
import { GrammyError } from "grammy";
import cfg from "../../config.js";
import moment from "moment";
import cacheManager from "../../cache/cache.js";

async function broadcast_chats_cmd(ctx: IGroupHearsContext): Promise<void> {
    const args = ctx.message.text!.split(" ");
    const ignorePremium = args.includes("-prem");
    if (!ctx.msg.reply_to_message) {
        return void ctx.reply("Команда має бути у відповідь на цільове повідомлення.");
    }

    ctx.api.config.use(autoRetry());

    let successfullySent = 0;
    let totalAttemptsSent = 0;
    ctx.reply(`Розрочато розсилку.\n${ignorePremium ? "- Ігнорування преміум чатів" : ""}`).catch((e) => {});
    await cacheManager.PremiumStatusCache.seed_chats();
    for (let chat in active.data) {
        if (!chat.startsWith("-")) {
            delete active.data[chat];
            continue;
        }

        for (let user in active.data[chat]) {
            if (moment().diff(moment(active.data[chat][user]!.active_last), "days") < 5) {
                if (ignorePremium && cacheManager.PremiumStatusCache.get(+chat).status) break;

                try {
                    totalAttemptsSent++;
                    void (await ctx.api.forwardMessage(chat, ctx.chat.id, ctx.msg.reply_to_message.message_id, {
                        disable_notification: true,
                    }));
                    successfullySent++;
                } catch (e) {
                    console.error(e);
                    if (e instanceof GrammyError && e.description.includes("bot was kicked")) {
                        void DBPoolManager.getPoolWrite
                            .query(`UPDATE chats SET stats_bot_in = false WHERE chat_id = ${chat};`)
                            .catch((e) => {});
                    }
                }
                break;
            }
        }
    }

    void (await ctx.api
        .sendMessage(
            cfg.ANALYTICS_CHAT ?? -1,
            `Розсилку закінчено.\nУспішно надіслано ${successfullySent} повідомлень.\nСпроб надіслати: ${totalAttemptsSent}\nЧатів в списку: ${
                Object.keys(active.data).length
            }`
        )
        .catch((e) => {}));
    console.info(
        `Розсилку закінчено.\nУспішно надіслано ${successfullySent} повідомлень.\nСпроб надіслати: ${totalAttemptsSent}\nЧатів в списку: ${
            Object.keys(active.data).length
        }`
    );
}

export default broadcast_chats_cmd;
