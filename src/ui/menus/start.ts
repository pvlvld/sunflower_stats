import help_cmd from "../../commands/help.js";
import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";

const start_menu = new Menu<IContext>("sart-menu", {
    autoAnswer: true,
})
    .text("Команди бота", (ctx) => void help_cmd(ctx))
    .row()
    .url((ctx) => ctx.t("button-add-bot"), "https://t.me/soniashnyk_statistics_bot?startgroup")
    .row()
    .url((ctx) => ctx.t("button-plz-donate "), "https://send.monobank.ua/jar/6TjRWExdMt");

export default start_menu;
