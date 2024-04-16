import getUserStatsMessage from "../utils/getUserStatsMessage";
import type DbStats from "../db/stats";
import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import { active } from "../data/active";
const Big = require("big-js");

async function stats_my(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats
) {
  if ([136817688, 777000].includes(ctx.from.id)) {
    return;
  }

  await ctx.reply(
    getUserStatsMessage(ctx.chat.id, ctx.from.id, await dbStats.user.all(ctx.chat.id, ctx.from.id)),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_my;
