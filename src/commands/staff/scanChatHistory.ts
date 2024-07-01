import type { IGroupHearsContext } from "../../types/context";
import { historyScanner } from "../../scanner/historyScanner";

async function scanChatHistory_cmd(ctx: IGroupHearsContext) {
  let chatIdentifier = ctx.msg.text?.split(" ")[1];

  if (!chatIdentifier) {
    chatIdentifier = ctx.chat.username || (await ctx.getChat()).invite_link;
  }

  if (!chatIdentifier) {
    return ctx.reply("Не вдалося отримати юзернейм чи запрошення в чат.");
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
