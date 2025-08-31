import { autoRetry } from "@grammyjs/auto-retry";
import { LOCALE_LANGUAGE_MAP } from "../../consts/localeLanguageMap.js";
import { VISIBLE_BOT_COMMANDS } from "../../consts/visibleBotCommands.js";
import { IGroupTextContext } from "../../types/context.js";
import { localeNegotiator } from "../../utils/localeNegotiator.js";
import { LocaleService } from "../../cache/localeService.js";
import type { LanguageCode } from "@grammyjs/types";

async function updateBotLocalization(ctx: IGroupTextContext) {
    const startLocale = await localeNegotiator(ctx);
    ctx.api.config.use(autoRetry());

    for (let locale of Object.keys(LOCALE_LANGUAGE_MAP)) {
        if (locale === "en") continue; // Skip English as it is the default
        LocaleService.set(ctx.chat.id, locale);
        await ctx.i18n.renegotiateLocale();

        const commands = VISIBLE_BOT_COMMANDS.map((command) => {
            const commandKey = `bot-command-${command}`;
            return {
                command: command,
                description: ctx.t(commandKey, { defaultValue: command }),
            };
        });

        await ctx.api.setMyCommands(commands, { language_code: locale as LanguageCode });
        await ctx.api.setMyDescription(
            ctx.t("bot-about", {
                defaultValue:
                    "Your favorite stats bot! 😉\nCharts with custom backgrounds!\nStats for any day and time range!\n\nChannel: @soniashnyk",
            }),
            {
                language_code: locale as LanguageCode,
            },
        );
        await ctx.api.setMyShortDescription(
            ctx.t("bot-description", { defaultValue: "Your favorite stats bot! 😉" }),
            {
                language_code: locale as LanguageCode,
            },
        );
    }

    LocaleService.set(ctx.chat.id, startLocale);

    await ctx.reply("Localization updated successfully!").catch((e) => {});
}

export { updateBotLocalization };
