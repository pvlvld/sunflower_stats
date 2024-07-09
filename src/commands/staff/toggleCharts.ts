import cfg from "../../config.js";
import { IGroupHearsContext } from "../../types/context.js";

async function toggleCharts(ctx: IGroupHearsContext) {
  if (!cfg.ADMINS.includes(ctx.from.id)) {
    return;
  }

  cfg.SETTINGS.charts = !cfg.SETTINGS.charts;
  const res = `Графіки статистики: ${cfg.SETTINGS.charts}`;
  console.log(res);
  await ctx.reply(res).catch((e) => {});
}

export { toggleCharts };
