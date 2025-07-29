// import { removeChatData } from "../../utils/removeChatData.js";
// import type { IContext } from "../../types/context.js";
// import { Menu } from "@grammyjs/menu";
// import cfg from "../../config.js";

// const leftGroup_menu = new Menu<IContext>("leftGroup-menu", {
//     autoAnswer: true,
// })
//     .text("Видалити дані чату", async (ctx) => {
//         if (!cfg.ADMINS.includes(ctx.from.id)) {
//             return;
//         }
//         if (!ctx.msg?.text) {
//             return void (await ctx.answerCallbackQuery("Це меню застаріло, створіть нове."));
//         }

//         const chat_id = ctx.msg.text.substring(ctx.msg.text.lastIndexOf("-"));
//         const removedRows = await removeChatData(chat_id);

//         if (removedRows === -1) {
//             return void (await ctx
//                 .editMessageText(
//                     ctx.msg.text + "\nНе вдалося видалити дані чату. Помилка бази даних."
//                 )
//                 .catch((e) => {}));
//         }

//         return void (await ctx
//             .editMessageText(ctx.msg.text + `\nВидалено ${removedRows} записів.`, {
//                 reply_markup: undefined,
//             })
//             .catch((e) => {}));
//     })
//     .row()
//     .text("Відмінити", async (ctx) => {
//         void (await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch((e) => {}));
//     });

// export { leftGroup_menu };
