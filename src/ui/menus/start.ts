import help_cmd from "../../commands/help.js";
import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";

const start_menu = new Menu<IContext>("help-menu", {
    autoAnswer: true,
})
    .text("Команди бота", async (ctx) => help_cmd(ctx))
    .row()
    .url("Додати бота в чат", "https://t.me/soniashnyk_statistics_bot?startgroup")
    .row()
    .url("Підтримати існування соняха.", "https://send.monobank.ua/jar/6TjRWExdMt");

export default start_menu;
