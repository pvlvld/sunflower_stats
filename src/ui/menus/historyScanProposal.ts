import { scanNewChat } from "../../scanner/scanNewChat.js";
import type { IContext } from "../../types/context.js";
import { Menu } from "@grammyjs/menu";

const historyScanProposal_menu = new Menu<IContext>("historyScanProposal-menu", {
  autoAnswer: true,
})
  .text("Так", async (ctx) => {
    if (["supergroup", "group"].includes(ctx.chat?.type!)) {
      const res = await scanNewChat(ctx as any);
      if (res === "not enough rights") {
        return;
      } else {
        ctx.deleteMessage().catch((e) => {});
      }
    } else {
      console.error("historyScanProposal_menu: wtf?", ctx);
      ctx.deleteMessage().catch((e) => {});
    }
  })
  .text("Ні", async (ctx) => {
    ctx.deleteMessage().catch((e) => {});
  });

export { historyScanProposal_menu };
