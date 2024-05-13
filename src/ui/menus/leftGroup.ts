import type { IGroupContext } from "../../types/context";
import type { Filter } from "grammy";
import { removeChatData } from "../../utils/removeChatData";
import { Menu } from "@grammyjs/menu";
import cfg from "../../config";

const leftGroup_menu = new Menu<Filter<IGroupContext, ":text">>("leftGroup-menu", {
  autoAnswer: true,
}).text("Видалити дані чату", async (ctx) => {
  if (!cfg.ADMINS.includes(ctx.from.id)) {
    return;
  }

  const chat_id = ctx.msg.text.substring(ctx.msg.text.lastIndexOf("-"));
  const removedRows = await removeChatData(chat_id);

  if (removedRows === -1) {
    return void ctx
      .editMessageText(ctx.msg.text + "\nНе вдалося видалити дані чату. Помилка бази даних.")
      .catch((e) => {});
  }

  return void ctx
    .editMessageText(ctx.msg.text + `\nВидалено ${removedRows} записів.`, {
      reply_markup: undefined,
    })
    .catch((e) => {});
});

export { leftGroup_menu };
