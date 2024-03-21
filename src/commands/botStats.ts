import bot from "../bot";
import moment from "moment";
import type { MyContext } from "../types/context";

type IBotStats = {
  commands: { [key: string]: number };
  joinGroups: number;
  leftGroups: number;
  messages: {
    total: number;
    start_count_date: Date;
  };
};

const BOT_STATS: IBotStats = {
  commands: {},
  joinGroups: 0,
  leftGroups: 0,
  messages: {
    total: 0,
    start_count_date: new Date(),
  },
};

function getStatsMsg() {
  let statsMsg = `
  Нових чатів: ${BOT_STATS.joinGroups}
  Покинуто чатів: ${BOT_STATS.leftGroups}
  
  Повідомлень за ${moment
    .duration(BOT_STATS.messages.start_count_date.getTime() - Date.now())
    .humanize()}: ${BOT_STATS.messages.total}`;

  if (Object.keys(BOT_STATS.commands).length > 0) {
    statsMsg += "\n\nЧастота використання команд:\n";
  }

  for (const cmd in BOT_STATS.commands) {
    statsMsg += `${cmd} - ${BOT_STATS.commands[cmd]}\n`;
  }

  return statsMsg;
}

async function bot_stats_cmd(ctx: MyContext) {
  await ctx.reply(getStatsMsg(), {
    link_preview_options: { is_disabled: true },
  });
}

export const botStatsManager = {
  commandUse: (cmd: string) => {
    BOT_STATS.commands[cmd] ??= 0;
    BOT_STATS.commands[cmd]++;
  },
  joinGroup: () => BOT_STATS.joinGroups++,
  leftGroup: () => BOT_STATS.leftGroups++,
  newMessage: () => BOT_STATS.messages.total++,
  resetMessages: () => {
    BOT_STATS.messages.total = 0;
    BOT_STATS.messages.start_count_date = new Date();
  },
  resetAll: () => {
    botStatsManager.resetMessages();
    BOT_STATS.commands = {};
    BOT_STATS.joinGroups = 0;
  },
  sendToMainChat: async () => {
    return await bot.api.sendMessage("-1001898242958", getStatsMsg()).catch(() => {});
  },
};

export default bot_stats_cmd;
