import moment from "moment";
import IActive from "../../data/active";
import YAMLWrapper from "../../data/YAMLWrapper";
import { autoRetry } from "@grammyjs/auto-retry";
import { GrammyError, type HearsContext } from "grammy";
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

  // REMOVE
  let start_owner = 814121095;
  let start_chat = "-1001898242958";
  let blocked_owner = true;
  let blocked_chat = true;
  //REMOVE

  for (let chat in active.data) {
    //REMOVE
    if (chat === start_chat) {
      blocked_chat = false;
    }
    if (blocked_chat) {
      continue;
    }
    //REMOVE
    for (let user in active.data[chat]) {
      if (moment().diff(moment(active.data[chat]![user]!.active_last), "days") < 3) {
        admins = await ctx.api.getChatAdministrators(chat);
        owner = admins.filter((a) => a.status === "creator")[0] as any;
        // REMOVE
        if (owner) {
          if ((owner.user.id = start_owner)) {
            blocked_owner = false;
            continue;
          }
          if (blocked_owner) {
            continue;
          }
          // REMOVE

          await ctx.api
            .forwardMessage(owner.user.id, ctx.chat.id, ctx.msg.reply_to_message.message_id, {
              disable_notification: true,
            })
            .catch((e) => {});
          counter++;
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
