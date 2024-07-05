import type { IGroupHearsContext } from "../../types/context";
import { historyScanner } from "../../scanner/historyScanner";
import { getChatUsernameOrInvite } from "../../utils/getChatUsernameOrInviteLink";
import cacheManager from "../../cache/cache";

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
    cacheManager.ChartCache_Chat.removeChat(result.chat_id);
    cacheManager.ChartCache_User.removeChat(result.chat_id);
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
