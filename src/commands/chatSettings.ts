import type { IGroupCommandContext, IGroupTextContext } from "../types/context.js";
import { getChatSettingsMessageText } from "../utils/chatSettingsUtils.js";
import { settings_menu } from "../ui/menus/settings.js";
import isChatOwner from "../utils/isChatOwner.js";

async function chatSettings_cmd(ctx: IGroupTextContext | IGroupCommandContext) {
  if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
    void (await ctx
      .reply(await getChatSettingsMessageText(ctx), { reply_markup: settings_menu })
      .catch((e) => {}));
  }
}

export { chatSettings_cmd };
