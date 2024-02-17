"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const menu_1 = require("@grammyjs/menu");
const start_menu = new menu_1.Menu("start-menu", {
    autoAnswer: true,
})
    .url("Додати бота в чат", "https://t.me/soniashnyk_statistics_bot?startgroup")
    .row()
    .url("Підтримати існування соняха.", "https://send.monobank.ua/jar/6TjRWExdMt");
exports.default = start_menu;
