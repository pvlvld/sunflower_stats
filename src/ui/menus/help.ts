import { Menu } from "@grammyjs/menu";
import { MyContext } from "../../types/context";

const help_menu = new Menu<MyContext>("help-menu", {
  autoAnswer: true,
}).url(
  "Підтримати існування соняха.",
  "https://send.monobank.ua/jar/6TjRWExdMt"
);

export default help_menu;
