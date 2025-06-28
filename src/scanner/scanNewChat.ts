import { historyScanner } from "./historyScanner.js";
import { IGroupContext } from "../types/context.js";
import { GrammyError } from "grammy";

async function scanNewChat(ctx: IGroupContext, automatic = true) {
    let identifier = "";

    if (ctx.chat.username) {
        identifier = ctx.chat.username;
    } else {
        try {
            const invite = await ctx.createChatInviteLink({
                creates_join_request: false,
            });
            identifier = invite.invite_link;
        } catch (e) {
            if (e instanceof GrammyError) {
                if (e.description.includes("not enough rights")) {
                    void (await ctx.reply(ctx.t("history-scan-nor-invite")).catch((e) => {}));
                    return "not enough rights";
                }
            }
            console.error(e);
        }
    }

    if (identifier.length == 0) {
        if (!automatic) {
            void (await ctx.reply(ctx.t("history-scan-cant-start")).catch((e) => {}));
        }

        return;
    }
    const result = await historyScanner.scanChat(identifier, ctx.chat.id);

    if (!result.status) {
        console.error(result.error);
        if (!automatic) {
            void (await ctx.reply(ctx.t(result.localeError.message, result.localeError.variables)).catch((e) => {}));
        }
        return;
    } else {
        if (!automatic) {
            void (await ctx.reply(ctx.t("history-scan-finished", { count: result.count })).catch((e) => {}));
        }
        return;
    }
}

export { scanNewChat };
