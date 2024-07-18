import { historyScanner } from "./historyScanner.js";
import { IGroupContext } from "../types/context.js";
import { GrammyError } from "grammy";

async function scanNewChat(ctx: IGroupContext, automatic = true) {
  let identifier = "";

  if (ctx.chat.username) {
    identifier = ctx.chat.username;
  } else {
    try {
      const invite = await ctx.createChatInviteLink({
        creates_join_request: false,
      });
      identifier = invite.invite_link;
    } catch (e) {
      if (e instanceof GrammyError) {
        if (e.description.includes("not enough rights")) {
          void (await ctx
            .reply(
              "Видайте мені дозвіл запрошувати учасників або зробіть чат публічним, щоб я зміг додати сканер."
            )
            .catch((e) => {}));
          return "not enough rights";
        }
      }
      console.error(e);
    }
  }

  if (identifier.length == 0) {
    if (!automatic) {
      void (await ctx
        .reply(
          "Не вдалось отримати ідентифікатор чату для додавання сканеру. Переконайтеся, що я маю право додавати нових учасників або зробіть чат публічним."
        )
        .catch((e) => {}));
    }

    return;
  }
  const result = await historyScanner.scanChat(identifier, ctx.chat.id);

  if (!result.status) {
    const error = result.error instanceof Error ? result.error.message : result.error;
    console.error(error);
    if (!automatic) {
      void (await ctx.reply(error).catch((e) => {}));
    }
    return;
  } else {
    if (!automatic) {
      void (await ctx
        .reply(`Успішно відскановано та додано в статистику ${result.count} повідомлень!`)
        .catch((e) => {}));
    }
    return;
  }
}

export { scanNewChat };
