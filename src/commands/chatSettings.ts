import type { IGroupCommandContext, IGroupTextContext } from "../types/context";
import { getChatSettingsMessageText } from "../utils/chatSettingsUtils";
import { settings_menu } from "../ui/menus/settings";
import isChatOwner from "../utils/isChatOwner";

async function chatSettings_cmd(ctx: IGroupTextContext | IGroupCommandContext) {
  if (await isChatOwner(ctx.chat.id, ctx.from.id)) {
    void (await ctx
      .reply(await getChatSettingsMessageText(ctx), { reply_markup: settings_menu })
      .catch((e) => {}));
  }
}

export { chatSettings_cmd };
