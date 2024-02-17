import { MyContext } from "../types/context";

type IBotStats = {
  commands: { [key: string]: number };
  newGroups: number;
};

const BOT_STATS: IBotStats = {
  commands: {},
  newGroups: 0,
};

function bot_stats_cmd(ctx: MyContext) {
  let statsMsg = `Нових чатів: ${BOT_STATS.newGroups}\n\n`;

  for (const cmd in BOT_STATS.commands) {
    statsMsg += `${cmd} - ${BOT_STATS.commands[cmd]}\n`;
  }

  ctx.reply(statsMsg);
}

export const collectBotStats = {
  command: (cmd: string) => {
    BOT_STATS.commands[cmd] ??= 0;
    BOT_STATS.commands[cmd]++;
  },
  newGroups: () => BOT_STATS.newGroups++,
};

export default bot_stats_cmd;
