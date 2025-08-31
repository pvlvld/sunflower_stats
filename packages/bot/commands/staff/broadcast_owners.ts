import type { IGroupHearsContext } from "../../types/context.js";
import type { ChatMemberOwner } from "@grammyjs/types";
import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../redis/active.js";
import moment from "moment";

async function broadcast_owners_cmd(ctx: IGroupHearsContext): Promise<void> {
    if (!ctx.msg.reply_to_message) {
        return void ctx.reply("Команда має бути у відповідь на цільове повідомлення.");
    }

    ctx.api.config.use(async (prev, method, payload, signal) => {
        return autoRetry()(prev, method, payload, signal);
    });

    let admins: Awaited<ReturnType<typeof ctx.api.getChatAdministrators>>;
    let owner: ChatMemberOwner | undefined;
    let counter = 0;
    const chats = await active.getAllChatIds();
    let users: Awaited<ReturnType<typeof active.getChatUsers>> = {};
    for (let chat of chats) {
        users = await active.getChatUsers(chat);
        for (let user in users) {
            if (moment().diff(moment(users[user].active_last), "days") < 3) {
                admins = await ctx.api.getChatAdministrators(chat);
                owner = admins.filter((a) => a.status === "creator")[0] as any;
                if (!owner) {
                    break;
                }

                try {
                    await ctx.api.forwardMessage(
                        owner.user.id,
                        ctx.chat.id,
                        ctx.msg.reply_to_message.message_id,
                        {
                            disable_notification: true,
                        },
                    );
                    counter++;
                } catch (e) {
                    console.error(e);
                }
                break;
            }
        }
    }

    ctx.api
        .sendMessage(
            process.env.MAIN_CHAT ?? -1,
            `Розсилку власникам закінчено.\nУспішно надіслано ${counter} повідомлень.`,
        )
        .catch((e) => {});
}

export default broadcast_owners_cmd;
