import type { IGroupContext, IGroupTextContext } from "../../types";
import { Menu, type MenuFlavor } from "@grammyjs/menu";
import getUserNameLink from "../../utils/getUserNameLink";
import isChatOwner from "../../utils/isChatOwner";
import { autoRetry } from "@grammyjs/auto-retry";
import cacheManager from "../../utils/cache";
import { active } from "../../data/active";
import { GrammyError } from "grammy";

const chatCleanup_menu = new Menu<IGroupTextContext>("chatCleanup-menu", {
  autoAnswer: false,
  onMenuOutdated: async (ctx) => {
    await ctx.deleteMessage().catch((e) => {});
    await ctx.answerCallbackQuery("Ця чистка застаріла. Створіть нову.").catch((e) => {});
  },
})
  .dynamic(async (ctx, range) => {
    const targetMembers = cacheManager.TTLCache.get(`cleanup_${ctx.chat.id}`) as
      | { user_id: number }[]
      | undefined;

    range.text("Видалити ✅", async (ctx) => {
      ctx.answerCallbackQuery().catch((e) => {});

      if (!(await isChatOwner(ctx))) {
        return;
      }

      if (await destroyMenuIfOutdated(ctx, targetMembers)) {
        return void (await ctx.reply("Ця чистка застаріла. Створіть нову.").catch((e) => {}));
      }

      ctx.deleteMessage().catch((e) => {});

      const statusMessage = await ctx.reply("Починаю чистку!").catch((e) => {});
      const cleanupStatus = await chatCleanupWorker(ctx, targetMembers as { user_id: number }[]);

      if (statusMessage && cleanupStatus) {
        return void (await ctx.api
          .editMessageText(ctx.chat.id, statusMessage.message_id, "Чистку успішно закінчено!")
          .catch((e) => {}));
      }

      if (statusMessage) {
        return void (await ctx.api
          .editMessageText(
            ctx.chat.id,
            statusMessage.message_id,
            "⚠️ У бота недостатньо прав. Будь ласка, видайте боту наступні права: \nБлокувати користувачів (Ban users)"
          )
          .catch((e) => {}));
      }
    });

    range.text("Скасувати ❌", async (ctx) => {
      ctx.answerCallbackQuery().catch((e) => {});

      if (!(await isChatOwner(ctx)) || (await destroyMenuIfOutdated(ctx, targetMembers))) {
        return;
      }

      cacheManager.TTLCache.del(`cleanup_${ctx.chat.id}`);
      await ctx.menu.close({ immediate: true }).catch((e) => {});
      await ctx.deleteMessage().catch((e) => {});
    });

    range.row().text("Список 🔍", async (ctx) => {
      ctx.answerCallbackQuery().catch((e) => {});

      if (!(await isChatOwner(ctx))) {
        return;
      }

      if (await destroyMenuIfOutdated(ctx, targetMembers)) {
        return void (await ctx.reply("Ця чистка застаріла. Створіть нову.").catch((e) => {}));
      }

      const targetMembersListIndex = ctx.msg?.text?.indexOf("Список:");

      if (targetMembersListIndex === -1) {
        let msg = `${ctx.msg!.text!.replace(
          /\d+/,
          String(targetMembers!.length)
        )}\n\nСписок:\n${getTargetMembersList(
          ctx.chat.id,
          targetMembers as { user_id: number }[]
        )}`;

        await ctx.editMessageText(msg, {
          link_preview_options: { is_disabled: true },
        });
      } else {
        ctx.editMessageText(ctx.msg!.text!.slice(0, targetMembersListIndex));
      }
    });

    return range;
  })
  .row()
  .url("Підтримати існування соняха 🧡", "https://send.monobank.ua/jar/6TjRWExdMt");

async function destroyMenuIfOutdated(
  ctx: IGroupTextContext & MenuFlavor,
  targetMembers: { user_id: number }[] | undefined
): Promise<boolean> {
  if (ctx.msg.text && !targetMembers) {
    try {
      ctx.menu.close({ immediate: true }).catch((e) => {});
      await ctx.deleteMessage().catch((e) => {});
      return true;
    } catch (error) {
      console.log(error);
      return true;
    }
  }
  return false;
}

const targetMembersListMaxSize = 100;

function getTargetMembersList(chat_id: number, targetMembers: { user_id: number }[]): string {
  const targetMemberNames: string[] = [];

  for (let i = 0; i < Math.min(targetMembersListMaxSize, targetMembers.length); i++) {
    if (active.data[chat_id]?.[targetMembers[i]?.user_id]) {
      targetMemberNames.push(
        getUserNameLink.html(
          active.data[chat_id]![targetMembers[i].user_id]!.name as string,
          active.data[chat_id]?.[targetMembers[i].user_id]?.username,
          targetMembers[i].user_id
        )
      );
    }
  }

  if (targetMembers.length > targetMembersListMaxSize) {
    targetMemberNames.push("...");
  }

  return targetMemberNames.join("\n");
}

async function chatCleanupWorker(
  ctx: IGroupContext & MenuFlavor,
  targetMembers: { user_id: number }[]
) {
  ctx.api.config.use(autoRetry());
  ctx.replyWithChatAction("typing").catch((e) => {});

  for (let i = 0; i < targetMembers.length; i++) {
    try {
      await ctx.banChatMember(targetMembers[i].user_id);
      delete active.data[ctx.chat.id]?.[targetMembers[i].user_id];
    } catch (e) {
      if (e instanceof GrammyError) {
        if (e.description.indexOf("not enough rights") !== -1) {
          cacheManager.TTLCache.del(`cleanup_${ctx.chat.id}`);
          return false;
        }
      } else {
        delete active.data[ctx.chat.id]?.[targetMembers[i].user_id];
      }
    }
  }
  cacheManager.TTLCache.del(`cleanup_${ctx.chat.id}`);
  return true;
}

export default chatCleanup_menu;
