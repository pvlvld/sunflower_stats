import bot from "../bot";
import moment from "moment";
import type { IContext } from "../types/context";
import { DBPoolManager } from "../db/poolManager";
import cacheManager from "../cache/cache";
import cfg from "../config";

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
  const sortedCmdKeys = Object.keys(BOT_STATS.commands).sort(
    (c1, c2) => BOT_STATS.commands[c2] - BOT_STATS.commands[c1]
  );

  for (const cmd of sortedCmdKeys) {
    statsMsg += `${cmd} - ${BOT_STATS.commands[cmd]}\n`;
  }

  const dbPoolsQueueStatus = DBPoolManager.getPoolsQueueStatus();
  statsMsg += `\n\nread queue: ${dbPoolsQueueStatus.read}\nwrite queue: ${dbPoolsQueueStatus.write}`;

  statsMsg += "\n";
  statsMsg += `Chat charts: ${cacheManager.ChartCache_Chat.size}\n`;
  statsMsg += `User charts: ${cacheManager.ChartCache_User.size}\n`;
  return statsMsg;
}

async function bot_stats_cmd(ctx: IContext) {
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
    BOT_STATS.leftGroups = 0;
  },
  sendToAnalyticsChat: async () => {
    return await bot.api
      .sendMessage(cfg.ANALYTICS_CHAT, getStatsMsg(), { message_thread_id: 3126 })
      .catch(() => {});
  },
};

export default bot_stats_cmd;
