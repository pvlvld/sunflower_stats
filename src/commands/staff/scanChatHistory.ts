import type { IGroupHearsContext } from "../../types/context";
import { historyScanner } from "../../scanner/historyScanner";
import { getChatUsernameOrInvite } from "../../utils/getChatUsernameOrInviteLink";

async function scanChatHistory_cmd(ctx: IGroupHearsContext) {
  let chatIdentifier: string | number | undefined = ctx.msg.text?.split(" ")[1];

  if (!chatIdentifier) {
    chatIdentifier = ctx.chat.username || (await ctx.getChat().catch((e) => {}))?.invite_link;
  }

  if (!chatIdentifier) {
    return ctx.reply("Не вдалося отримати юзернейм чи запрошення в чат.");
  }

  if (chatIdentifier.startsWith("-")) {
    const usernameOrInvite = await getChatUsernameOrInvite(Number(chatIdentifier));

    if (usernameOrInvite.type === "username") {
      chatIdentifier = usernameOrInvite.username;
    } else if (usernameOrInvite.type === "invite") {
      chatIdentifier = usernameOrInvite.invite;
    } else {
      await ctx.reply("Не вдалось отримати юзернейм чи запрошення в чат.");
      return;
    }
  }

  await ctx.reply(`Сканування ${chatIdentifier} запущено!`);
  const result = await historyScanner.scanChat(chatIdentifier);

  if (!result.status) {
    console.error(result.error);
    return ctx.reply(`
Щось пішло не так під час сканування ${chatIdentifier}
Відскановано: ${result.count} повідомлень.`);
  } else {
    return ctx.reply(`
Успішно відскановано ${result.count} повідомлень в ${chatIdentifier}
`);
  }
}

export { scanChatHistory_cmd };
