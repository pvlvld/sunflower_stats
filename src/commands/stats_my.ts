import type { MyContext } from "../types/context";
import type { ChatTypeContext, HearsContext } from "grammy";
import DbStats from "../db/stats";
import TodayStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import { IActive } from "../data/active";
import getUserStatsMessage from "../utils/getUserStatsMessage";

async function stats_my(
  ctx: HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
  dbStats: DbStats,
  todayStats: TodayStats,
  active: YAMLWrapper<IActive>
) {
  ctx.reply(
    getUserStatsMessage(
      ctx.chat.id,
      ctx.from,
      await dbStats.user.all(ctx.chat.id, ctx.from.id),
      todayStats,
      active
    ),
    {
      parse_mode: "HTML",
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default stats_my;
