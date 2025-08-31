import type { IContext } from "../types/context.js";
import { SettingsService } from "./settingsService.js";

async function getChatSettingsMessageText(ctx: IContext) {
    const chatSettings = await SettingsService.getInstance().getChatSettings(ctx.chat!.id);

    return `
${ctx.chat!.title}
${ctx.t("settings-message", {
    charts: chatSettings.charts ? "✅" : "❌",
    usechatbgforall: chatSettings.usechatbgforall ? "✅" : "❌",
    statsadminsonly: chatSettings.statsadminsonly ? "✅" : "❌",
    selfdestructstats: chatSettings.selfdestructstats ? "✅" : "❌",
    userstatslink: chatSettings.userstatslink ? "✅" : "❌",
})}
`;
}

export { getChatSettingsMessageText };
