import moment from "moment";
import IActive from "../../data/active";
import YAMLWrapper from "../../data/YAMLWrapper";
import { autoRetry } from "@grammyjs/auto-retry";
import type { HearsContext } from "grammy";
import type { ChatMemberOwner } from "@grammyjs/types";
import type { MyContext } from "../../types/context";

async function broadcast_owners_cmd(
  ctx: HearsContext<MyContext>,
  active: YAMLWrapper<IActive>
): Promise<void> {
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
        if (owner) {
          await ctx.api.forwardMessage(
            owner.user.id,
            ctx.chat.id,
            ctx.msg.reply_to_message.message_id,
            {
              disable_notification: true,
            }
          );
          counter++;
        }

        break;
      }
    }
  }

  ctx.reply(`Розсилку власникам закінчено.\nУспішно надіслано ${counter} повідомлень.`);
}

export default broadcast_owners_cmd;
