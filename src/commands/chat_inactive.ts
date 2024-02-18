import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";
import { type MyContext } from "../types/context";
import Escape from "../utils/escape";
import getUserNameLink from "../utils/getUserNameLink";
import parseCmdArgs from "../utils/parseCmdArgs";
import { type ChatTypeContext, type HearsContext, type Filter } from "grammy";

const PAGE_LENGTH = 25;

function chatInactive_cmd(
  ctx: Filter<
    HearsContext<ChatTypeContext<MyContext, "supergroup" | "group">>,
    ":text"
  >,
  active: YAMLWrapper<IActive>
) {
  const page = parseInt(parseCmdArgs(ctx.msg.text)[0]);
  if (!page) return ctx.reply("Введіть номер сторінки.\n!неактив 1");

  ctx.reply(getInactivePageMessage(ctx.chat.id, Math.abs(page), active), {
    parse_mode: "HTML",
  });
}

function getInactivePageMessage(
  chat_id: number,
  page: number,
  active: YAMLWrapper<IActive>
) {
  const inactiveUsers = getInactivePage(chat_id, page, active);
  if (inactiveUsers.length === 0) return "Ця сторінка порожня\\.";

  return inactiveUsers
    .map(
      (user, i) =>
        `${i + 1 + (page - 1) * PAGE_LENGTH}. ${genUserPageRecord(
          chat_id,
          user,
          active
        )}`
    )
    .join("\n");
}

function genUserPageRecord(
  chat_id: number,
  user: string,
  active: YAMLWrapper<IActive>
) {
  return `<b>${getUserNameLink.html(
    active.data[chat_id]?.[user]?.nickname ||
      active.data[chat_id]?.[user]?.name ||
      "невідомо",
    active.data[chat_id]?.[user]?.username,
    user
  )}</b> — ${active.data[chat_id]?.[user]?.active_last || "невідомо"}`;
}

function getInactivePage(
  chat_id: number,
  page: number,
  active: YAMLWrapper<IActive>
) {
  return getSortedInactive(chat_id, active).slice(
    PAGE_LENGTH * (page - 1),
    PAGE_LENGTH * (page - 1) + PAGE_LENGTH
  );
}

function getSortedInactive(chat_id: number, active: YAMLWrapper<IActive>) {
  return Object.keys(active.data?.[chat_id] || {}).sort((u1, u2) => {
    return (active.data?.[chat_id]?.[u1]?.active_last || 0) >
      (active.data?.[chat_id]?.[u2]?.active_last || 0)
      ? 1
      : -1;
  });
}

export default chatInactive_cmd;
