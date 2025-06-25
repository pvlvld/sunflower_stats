import { Menu } from "@grammyjs/menu";
import { Context } from "grammy";
import type { IContext } from "../../types/context.js";

const donate_menu = new Menu<IContext>("donate-menu").dynamic(async (ctx, range) => {
    range.url((ctx) => ctx.t("donate-menu-text"), getDonateUrl(ctx));
});

function getDonateUrl(ctx: Context): string {
    if (ctx.chat?.type === "private") {
        return `https://send.monobank.ua/jar/6TjRWExdMt?a=15&t=user_id${ctx.from!.id}`;
    } else {
        return `https://send.monobank.ua/jar/6TjRWExdMt?a=30&t=group_id${ctx.chat!.id}`;
    }
}

export { donate_menu };
