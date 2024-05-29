import { Menu } from "@grammyjs/menu";
import { Context } from "grammy";

const donate_menu = new Menu("donate-menu").dynamic(async (ctx, range) => {
  range.url("Задонатити 💸🫰🏻", getDonateUrl(ctx));
});

function getDonateUrl(ctx: Context): string {
  if (ctx.chat?.type === "private") {
    return `https://send.monobank.ua/jar/6TjRWExdMt?a=15&t=user_id${ctx.chat!.id}`;
  } else {
    return `https://send.monobank.ua/jar/6TjRWExdMt?a=30&t=group_id${ctx.chat!.id}`;
  }
}

export { donate_menu };
