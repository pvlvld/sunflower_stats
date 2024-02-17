import { MyContext } from "../types/context";

type IBotStats = {
  commands: { [key: string]: number };
};

const BOT_STATS: IBotStats = {
  commands: {},
};

function bot_stats_cmd(ctx: MyContext) {
  let cmdUsageMsg = "";

  for (const cmd in BOT_STATS.commands) {
    cmdUsageMsg += `${cmd} - ${BOT_STATS.commands[cmd]}\n`;
  }

  ctx.reply(cmdUsageMsg);
}

export const collectBotStats = {
  command: (cmd: string) => {
    BOT_STATS.commands[cmd] ??= 0;
    BOT_STATS.commands[cmd]++;
  },
};

export default bot_stats_cmd;
