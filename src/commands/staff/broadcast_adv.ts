import { autoRetry } from "@grammyjs/auto-retry";
import cfg from "../../config.js";
import { Database } from "../../db/db.js";
import { extractAndMakeKeyboard } from "../../utils/extractAndMakeKeyboard.js";
import moment from "moment";
import { IGroupHearsContext } from "../../types/context.js";
import { IMessage, sendMediaMessage } from "../../utils/sendMediaMessage.js";
import { getMessageMedia } from "../../utils/getMessageMedia.js";
import cacheManager from "../../cache/cache.js";
import { active } from "../../redis/active.js";

async function broadcast_adv(ctx: IGroupHearsContext, test = true) {
    if (!cfg.ADMINS.includes(ctx.from.id)) {
        return;
    }

    const media = getMessageMedia(ctx);
    let text = (ctx.msg.text ?? ctx.msg.caption).slice("!ssadv ".length);
    const keyboard = extractAndMakeKeyboard(ctx, text);
    if (!keyboard) {
        return;
    }
    text = keyboard?.text ?? text;
    if (test) {
        // Echo for testing
        await sendMediaMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.keyboard, text });
    } else {
        await ctx.reply("Починаю розсилку!").catch((e) => {});
        await sendMediaMessage(ctx, ctx.chat.id, { media, keyboard: keyboard?.keyboard, text });
        await broadcastToChats(ctx, { media, keyboard: keyboard?.keyboard, text });
    }
}

async function broadcastToChats(ctx: IGroupHearsContext, adv: IMessage) {
    let successfullySent = 0;
    let totalAttempts = 0;

    ctx.api.config.use(autoRetry());
    cacheManager.PremiumStatusCache.seed_chats();

    const start = performance.now();
    const chats = await active.getAllChatIds();
    let users: Awaited<ReturnType<typeof active.getChatUsers>> = {};
    chat_loop: for (const chat in chats) {
        if (!chat.startsWith("-")) continue;

        if (cacheManager.PremiumStatusCache.isCachedPremium(Number(chat))) {
            continue;
        }
        users = await active.getChatUsers(Number(chat));
        for (const user in users) {
            if (moment().diff(moment(users[user].active_last), "days") < 4) {
                // Skip if bot joined less than 14 days ago
                const botJoinDate = await Database.stats.chat.firstRecordDate(Number(chat));
                if (moment().diff(botJoinDate, "days") < 14) {
                    console.log("Adv broadcast: ", chat, "Skip, first message less than 14 days ago");
                    continue chat_loop;
                }
                totalAttempts++;

                // Sending
                successfullySent += +(await sendMediaMessage(ctx, chat, adv));
                break;
            }
        }
    }

    const end = performance.now();
    let timeMinutes = (end - start) / 1000 / 60;
    const timeSeconds = Math.round((timeMinutes % 1) * 60);
    timeMinutes = Math.floor(timeMinutes);

    const logMsg = `Розсилку закінчено за ${timeMinutes}хв ${timeSeconds}с.\nУспішно надіслано ${successfullySent} повідомлень за ${totalAttempts} спроб.`;
    console.log("Adv broadcast: ", logMsg);
    ctx.reply(logMsg).catch((e) => {});
}

export { broadcast_adv };
