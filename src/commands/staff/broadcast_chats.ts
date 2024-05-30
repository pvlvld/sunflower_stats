import type { IGroupHearsContext } from "../../types/context";
import { autoRetry } from "@grammyjs/auto-retry";
import { active } from "../../data/active";
import DBPoolManager from "../../db/db";
import { GrammyError } from "grammy";
import cfg from "../../config";
import moment from "moment";

async function broadcast_chats_cmd(ctx: IGroupHearsContext): Promise<void> {
  if (!ctx.msg.reply_to_message) {
    return void ctx.reply("Команда має бути у відповідь на цільове повідомлення.");
  }

  ctx.api.config.use(autoRetry())

  let counter = 0;

  for (let chat in active.data) {
    if (!chat.startsWith("-")) {
      active.data[chat] = undefined;
      continue;
    }

    for (let user in active.data[chat]) {
      if (moment().diff(moment(active.data[chat]![user]!.active_last), "days") < 3) {
        try {
          void (await ctx.api.forwardMessage(
            chat,
            ctx.chat.id,
            ctx.msg.reply_to_message.message_id,
            {
              disable_notification: true,
            }
          ));
          counter++;
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
      `Розсилку закінчено.\nУспішно надіслано ${counter} повідомлень.`
    )
    .catch((e) => {}));
  console.info(`Розсилку закінчено.\nУспішно надіслано ${counter} повідомлень.`);
}

export default broadcast_chats_cmd;
