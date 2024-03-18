import getUserStatsMessage from "../utils/getUserStatsMessage";
import type DbStats from "../db/stats";
import type { IActive } from "../data/active";
import type { MyContext } from "../types/context";
import type YAMLWrapper from "../data/YAMLWrapper";
import type { ChatTypeContext, HearsContext } from "grammy";
const Big = require("big-js");

async function stats_my(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  active: YAMLWrapper<IActive>
) {
  if ([136817688, 777000].includes(ctx.from.id)) {
    return;
  }

  await ctx.reply(
    getUserStatsMessage(
      ctx.chat.id,
      ctx.from.id,
      await dbStats.user.all(ctx.chat.id, ctx.from.id),
      active
    ),
    {
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_my;
