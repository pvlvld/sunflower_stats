"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const menu_1 = require("@grammyjs/menu");
const help_menu = new menu_1.Menu("help-menu", {
    autoAnswer: true,
}).url("Підтримати існування соняха.", "https://send.monobank.ua/jar/6TjRWExdMt");
exports.default = help_menu;
