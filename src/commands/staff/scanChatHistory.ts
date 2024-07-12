import { getChatUsernameOrInvite } from "../../utils/getChatUsernameOrInviteLink.js";
import type { IGroupHearsContext } from "../../types/context.js";
import { historyScanner } from "../../scanner/historyScanner.js";
import cacheManager from "../../cache/cache.js";

async function scanChatHistory_cmd(ctx: IGroupHearsContext) {
  let chatIdentifier: string | number = ctx.msg.text?.split(" ")[1] || String(ctx.chat.id);

  if (!chatIdentifier || chatIdentifier.startsWith("-")) {
    const usernameOrInvite = await getChatUsernameOrInvite(Number(chatIdentifier));

    if (usernameOrInvite.type === "username") {
      chatIdentifier = usernameOrInvite.username;
    } else if (usernameOrInvite.type === "invite") {
      chatIdentifier = usernameOrInvite.invite;
    }
  }

  await ctx.reply(`Сканування ${chatIdentifier} запущено!`);
  const result = await historyScanner.scanChat(chatIdentifier);

  if (result.status) {
    if (typeof result.identifier === "number") {
      cacheManager.ChartCache_Chat.removeChat(result.identifier);
      cacheManager.ChartCache_User.removeChat(result.identifier);
    }
    return ctx
      .reply(
        `
    Успішно відскановано ${result.count} повідомлень в ${chatIdentifier}
    `
      )
      .catch((e) => {
        console.error(e);
      });
  } else {
    console.error(result.error);
    return ctx
      .reply(
        `
Щось пішло не так під час сканування ${chatIdentifier}
Відскановано: ${result.count} повідомлень.`
      )
      .catch((e) => {
        console.error(e);
      });
  }
}

export { scanChatHistory_cmd };
