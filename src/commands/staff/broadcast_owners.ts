import moment from "moment";
import { autoRetry } from "@grammyjs/auto-retry";
import type { IGroupHearsContext } from "../../types/context";
import type { ChatMemberOwner } from "@grammyjs/types";
import { active } from "../../data/active";

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

  for (let chat in active.data) {
    for (let user in active.data[chat]) {
      if (moment().diff(moment(active.data[chat]![user]!.active_last), "days") < 3) {
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
            }
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
      `Розсилку власникам закінчено.\nУспішно надіслано ${counter} повідомлень.`
    )
    .catch((e) => {});
}

export default broadcast_owners_cmd;
