import type { ChatFullInfo } from "@grammyjs/types";
import bot from "../bot.js";

type IResult =
  | { type: "error" }
  | { type: "username"; username: string; rawChatInfo: ChatFullInfo }
  | { type: "invite"; invite: string; rawChatInfo: ChatFullInfo };

async function getChatUsernameOrInvite(chat_id: number): Promise<IResult> {
  const chat_info = await bot.api.getChat(chat_id).catch((e) => {});

  if (chat_info === undefined) {
    return { type: "error" };
  }

  if (chat_info.username) {
    return { type: "username", username: chat_info.username, rawChatInfo: chat_info };
  } else if (chat_info.invite_link) {
    return {
      type: "invite",
      invite: chat_info.invite_link,
      rawChatInfo: chat_info,
    };
  } else {
    return { type: "error" };
  }
}

export { getChatUsernameOrInvite };
