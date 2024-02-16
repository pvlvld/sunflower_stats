import { Filter } from "grammy";
import { MyContext } from "../types/context";
import YAMLStats from "../data/stats";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

function leaveChatMemberHandler(
  ctx: Filter<MyContext, ":left_chat_member">,
  yamlStats: YAMLStats,
  active: YAMLWrapper<IActive>
) {
  delete active.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
  delete yamlStats.data[ctx.chat.id]?.[ctx.msg.left_chat_member.id];
}

export default leaveChatMemberHandler;
