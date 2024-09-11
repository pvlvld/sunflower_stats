import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";

const help_menu = new Menu<IContext>("help-menu", {
    autoAnswer: true,
})
    .url("Додати бота в чат", "https://t.me/soniashnyk_statistics_bot?startgroup")
    .row()
    .url("Підтримати існування соняха.", "https://send.monobank.ua/jar/6TjRWExdMt");

export default help_menu;
