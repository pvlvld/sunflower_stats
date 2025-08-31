import { historyScanner } from "../../scanner/historyScanner.js";
import { scanNewChat } from "../../scanner/scanNewChat.js";
import type { IContext } from "../../types/context.js";
import isChatOwner from "../../utils/isChatOwner.js";
import { Menu } from "@grammyjs/menu";

const historyScanProposal_menu = new Menu<IContext>("historyScanProposal-menu", {
    autoAnswer: true,
})
    .text(
        (ctx) => ctx.t("button-yes"),
        async (ctx) => {
            if (
                ctx.chat?.id &&
                ["supergroup", "group"].includes(ctx.chat?.type!) &&
                (await isChatOwner(ctx.chat.id, ctx.from.id))
            ) {
                if (historyScanner.isQueued(ctx.chat?.id || -1)) {
                    ctx.reply(ctx.t("history-scan-already-queued")).catch((e) => {});
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
        },
    )
    .text(
        (ctx) => ctx.t("button-no"),
        async (ctx) => {
            ctx.deleteMessage().catch((e) => {});
        },
    );

export { historyScanProposal_menu };
