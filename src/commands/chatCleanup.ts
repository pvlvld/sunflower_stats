import type { IGroupTextContext } from "../types/context";
import { DBPoolManager } from "../db/poolManager";
import isChatOwner from "../utils/isChatOwner";
import parseCmdArgs from "../utils/parseCmdArgs";
import chatCleanup_menu from "../ui/menus/chatCleanup";
import cacheManager from "../cache/cache";
import isValidNumbers from "../utils/isValidNumbers";
import { active } from "../data/active";
import moment from "moment";

export async function chatCleanup(ctx: IGroupTextContext): Promise<void> {
  const args = parseCmdArgs(ctx.msg.text ?? ctx.msg.caption);

  if (args.length !== 2 || !isValidNumbers([args[0], args[1]])) {
    return void (await ctx.reply(
      "Це робиться не так. Спробуйте щось на кшталт:\n!чистка 7 100\n7 - кількість днів, 100 - мінімальна кількість повідомлень за цей час"
    ));
  }

  if (!(await isChatOwner(ctx.chat.id, ctx.from.id))) {
    return;
  }

  if (cacheManager.TTLCache.get(`cleanup_${ctx.chat.id}`) !== undefined) {
    return void (await ctx.reply(
      "В чаті вже запущено іншу чистку. Відмініть її або зачекайте хвилину."
    ));
  }

  const [targetDaysCount, targetMessagesCount] = args as string[];

  let targetMembers = (
    await DBPoolManager.getPoolRead.query(
      `
      WITH chat_activity AS (
        SELECT user_id, SUM(count) AS total_count
        FROM public.stats_daily
        WHERE date >= current_date - INTERVAL '${parseInt(targetDaysCount)} DAY' AND chat_id = ${
        ctx.chat.id
      }
        GROUP BY user_id
      )
      SELECT user_id
      FROM chat_activity
      WHERE total_count < ${parseInt(targetMessagesCount)};
      `
    )
  ).rows as { user_id: number }[];

  // Filter left chat members & members that in chat less than targetDaysCount
  const beforeTargetDaysCount = moment().subtract(targetDaysCount + 1, "days");
  targetMembers = targetMembers.filter((m) => {
    return (
      active.data[ctx.chat.id]?.[m.user_id]?.active_first &&
      beforeTargetDaysCount.isSameOrBefore(active.data[ctx.chat.id]![m.user_id]!.active_first)
    );
  });

  if (targetMembers.length === 0) {
    return void (await ctx.reply("За вказаними параметрами знайдено 0 учасників."));
  }

  cacheManager.TTLCache.set(`cleanup_${ctx.chat.id}`, targetMembers, 60 * 5);
  void (await ctx.reply(
    getChatCleanupText(String(targetMembers.length), targetDaysCount, targetMessagesCount),
    { reply_markup: chatCleanup_menu }
  ));
}

export function getChatCleanupText(
  targetMembersCount: string,
  targetDaysCount: string,
  targetMessagesCount: string
) {
  return `Знайдено ${targetMembersCount} учасників, котрі за останні ${targetDaysCount} днів написали менше ${targetMessagesCount} повідомлень.`;
}
