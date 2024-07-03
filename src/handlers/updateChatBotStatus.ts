import type { IMyChatMemberContext } from "../types/context";
import { botStatsManager } from "../commands/botStats";
import { leftGroup_menu } from "../ui/menus/leftGroup";
import { hello } from "../commands/hello";
import help_cmd from "../commands/help";
import cfg from "../config";
import cacheManager from "../cache/cache";
import { active } from "../data/active";

async function updateChatBotStatus_handler(ctx: IMyChatMemberContext) {
  // Bot join chat
  if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.old_chat_member.status)) {
    await hello(ctx);
    await help_cmd(ctx);
    botStatsManager.joinGroup();

    if (ctx.chat.type === "supergroup") {
      try {
        const membersCount = await ctx.getChatMemberCount();
        const invite = (await ctx.getChat().catch((e) => {}))?.invite_link || "-";
        if (membersCount >= 50) {
          await ctx.api.sendMessage(
            cfg.ANALYTICS_CHAT,
            `✅📈 #Join ${ctx.chat.title}\n@${ctx.chat.username} ${invite}\nMembers count: <b>${membersCount}</b>\nID: ${ctx.chat.id}`,
            {
              reply_parameters: { message_id: -1, allow_sending_without_reply: true },
              disable_notification: true,
              message_thread_id: 3984,
            }
          );
        }
      } catch (e) {}
    }

    // Bot left chat
  } else if (cfg.STATUSES.LEFT_STATUSES.includes(ctx.myChatMember.new_chat_member.status)) {
    botStatsManager.leftGroup();

    const admins = cacheManager.ChatAdminsCache.getAdmins(ctx.chat.id);
    let admins_text = "";

    admins.forEach((a) => {
      admins_text +=
        admins_text +
        `<a href="tg://user?id=${a.user_id}">${
          active.data[ctx.chat.id]?.[a.user_id] || a.status
        }</a>: ${a.status}\n`;
    });

    if (admins_text.length) {
      admins_text = "Admins:\n" + admins_text;
    }

    if (ctx.chat.type === "supergroup" && ctx.chat.username) {
      await ctx.api
        .sendMessage(
          cfg.ANALYTICS_CHAT,
          `❌📉 #Left @${ctx.chat.username}\nID: ${ctx.chat.id}\n${admins_text}`,
          {
            reply_markup: leftGroup_menu,
            reply_parameters: { message_id: -1, allow_sending_without_reply: true },
            disable_notification: true,
            message_thread_id: 3984,
          }
        )
        .catch((e) => {});
    }
  }
}

export { updateChatBotStatus_handler };
