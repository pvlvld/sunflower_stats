import { historyScanner } from "../../scanner/historyScanner.js";
import { scanNewChat } from "../../scanner/scanNewChat.js";
import type { IContext } from "../../types/context.js";
import { sleepAsync } from "../../utils/sleep.js";
import { Menu } from "@grammyjs/menu";

const historyScanProposal_menu = new Menu<IContext>("historyScanProposal-menu", {
  autoAnswer: true,
})
  .text("Так", async (ctx) => {
    if (["supergroup", "group"].includes(ctx.chat?.type!)) {
      if (historyScanner.isQueued(ctx.chat?.id || -1)) {
        ctx.reply("Ваш чат вже в черзі на сканування.").catch((e) => {});
        return;
      }
      const res = scanNewChat(ctx as any, false);

      if ((await res) === "not enough rights") {
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
