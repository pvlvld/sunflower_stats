import { IGroupHearsContext } from "../types/context.js";
import parseCmdArgs from "../utils/parseCmdArgs.js";
import { isPremium } from "../utils/isPremium.js";
import { hexToRGB } from "../utils/hexToRGB.js";
import cacheManager from "../cache/cache.js";
import { Database } from "../db/db.js";

const targets = {
    line: ["графік", "лінія"],
    font: ["шрифт", "текст"],
};

const types = {
    personal: ["я"],
    chat: ["чат"],
};

// TODO: UI color picker
async function setChartColor(ctx: IGroupHearsContext) {
    const args = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);
    const target = resolveTarget(args[1]?.toLowerCase());
    const type = resolveType(args[2]?.toLowerCase());
    let hex = args[3];
    const rgb = hexToRGB(hex);

    // Command error checks
    if (!target) {
        void ctx
            .reply(
                'Некоректно вказано ціль. Доступні: графік / лінія та шрифт / текст.\nПриклад: стата колір <u>графік</u> я <a href="https://g.co/kgs/5UEQqFv">#066666</a>'
            )
            .catch((e) => {});
        return;
    }

    if (!type) {
        void ctx
            .reply(
                'Некоректно вказано тип. Доступні: чат / я.\nПриклад: стата колір графік <u>я</u> <a href="https://g.co/kgs/5UEQqFv">#066666</a>'
            )
            .catch((e) => {});
        return;
    }

    if (!rgb || !hex) {
        void ctx
            .reply(
                'Колір має бути в форматі <a href="https://g.co/kgs/5UEQqFv">HEX</a>\nПриклад: стата колір <u>графік</u> я <u>#066666</u>'
            )
            .catch((e) => {});
        return;
    }

    // Donate status check
    if (type === "chat") {
        if (!(await isPremium(ctx.chat.id))) {
            ctx.reply("Ця функція доступна лише донат чатам.\nСкористайтесь командою /donate в потрібному чаті.").catch(
                (e) => {}
            );
            return;
        }
    } else {
        if (!(await isPremium(ctx.from.id))) {
            ctx.reply(
                "Ця функція доступна лише донат користувачам.\nСкористайтесь командою /donate в діалозі з ботом."
            ).catch((e) => {});

            return;
        }
    }

    // Cutoff # character
    if (hex.length === 7) {
        hex = hex.slice(1);
    }

    const settings = {
        ...(type === "personal"
            ? await Database.userSettings.get(ctx.from.id)
            : await Database.chatSettings.get(ctx.from.id)),
    };

    if (target === "line") {
        Object.assign(settings, { line_color: hex });
    } else {
        Object.assign(settings, { font_color: hex });
    }

    if (type === "chat") {
        await Database.chatSettings.set(ctx.chat.id, settings);
        cacheManager.ChartCache_Chat.removeChat(ctx.chat.id);
    } else {
        await Database.userSettings.set(ctx.from.id, settings);
        cacheManager.ChartCache_User.removeUser(ctx.from.id);
    }

    await ctx.react("💅").catch(async (e) => {
        await ctx.reply("💅 Колір успішно змінено!").catch((e) => {});
    });
}

function resolveType(raw_type: string | undefined) {
    if (types.personal.includes(raw_type as any)) {
        return "personal" as const;
    }

    if (types.chat.includes(raw_type as any)) {
        return "chat" as const;
    }

    return undefined;
}

function resolveTarget(raw_target: string | undefined) {
    if (targets.line.includes(raw_target as any)) {
        return "line" as const;
    }

    if (targets.font.includes(raw_target as any)) {
        return "font" as const;
    }

    return undefined;
}

export { setChartColor };
