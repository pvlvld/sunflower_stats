import type { ICommandContext, IContext } from "../types/context.js";
import { donate_menu } from "../ui/menus/donate.js";
import cacheManager from "../cache/cache.js";
import type { Filter } from "grammy";

async function donate_cmd(ctx: Filter<IContext, ":text">) {
  if (ctx.chat.type == "private") {
    ctx.reply(
      "Особистий преміум!\n\nЗа донат від 15грн вам буде доступно:\n- Зміна кольорів графіку та шрифту вашої статистики\n-Встановлення власного емоджі заклику й дати стосунків в @soniashnyk_bot.\n\nЩоб отримати преміум для чату, скористайтесь цією командою безпосередньо в ньому.",
      { reply_markup: donate_menu }
    );
  } else {
    ctx.reply(
      "Преміум для <u>чату</u>!\n\nЗа донат від 30грн вам буде доступно:\n- Можливість застосувати фон чату для статистики користувачів\n- Зміна кольорів графіку та шрифту статистики чату\n- 10 власних команд в @soniashnyk_bot\n- Гра «Крокодил» в @soniashnyk_bot.\n\nОплату може здійснити будь-який учасник чату.\nЩоб отримати преміум для власного акаунту, скористайтесь командою /donate в діалозі з ботом.",
      { reply_markup: donate_menu }
    );
  }
}

async function refreshDonate_cmd(ctx: ICommandContext) {
  if (!ctx.from?.id) {
    return;
  }

  cacheManager.PremiumStatusCache.del(ctx.from.id);
  cacheManager.PremiumStatusCache.del(ctx.chat.id);
  void (await ctx.reply("✅").catch((e) => {}));
}

export { donate_cmd, refreshDonate_cmd };
