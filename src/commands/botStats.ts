import moment from "moment";
import { MyContext } from "../types/context";

type IBotStats = {
  commands: { [key: string]: number };
  newGroups: number;
  messages: {
    total: number;
    start_count_date: Date;
  };
};

const BOT_STATS: IBotStats = {
  commands: {},
  newGroups: 0,
  messages: {
    total: 0,
    start_count_date: new Date(),
  },
};

function bot_stats_cmd(ctx: MyContext) {
  let statsMsg = `
Нових чатів: ${BOT_STATS.newGroups}

Повідомлень за ${moment
    .duration(BOT_STATS.messages.start_count_date.getTime() - Date.now())
    .humanize()}: ${BOT_STATS.messages.total}`;

  if (Object.keys(BOT_STATS.commands).length > 0) {
    statsMsg += "\n\nЧастота використання команд:";
  }

  for (const cmd in BOT_STATS.commands) {
    statsMsg += `${cmd} - ${BOT_STATS.commands[cmd]}\n`;
  }

  ctx.reply(statsMsg);
}

export const botStatsManager = {
  commandUse: (cmd: string) => {
    BOT_STATS.commands[cmd] ??= 0;
    BOT_STATS.commands[cmd]++;
  },
  newGroup: () => BOT_STATS.newGroups++,
  newMessage: () => BOT_STATS.messages.total++,
  resetMessages: () => {
    BOT_STATS.messages.total = 0;
    BOT_STATS.messages.start_count_date = new Date();
  },
  resetAll: () => {
    botStatsManager.resetMessages();
    BOT_STATS.commands = {};
    BOT_STATS.newGroups = 0;
  },
};

export default bot_stats_cmd;
