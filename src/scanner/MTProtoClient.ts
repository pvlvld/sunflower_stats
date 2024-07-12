import { Chat, TelegramClient } from "@mtcute/node";

class MTProtoClient {
  protected _client: TelegramClient;

  constructor(apiId: number, apiHash: string) {
    this._client = new TelegramClient({
      apiId,
      apiHash,
      floodSleepThreshold: 0,
      logLevel: 1,
    });
    this._client.run({}, async (self) => {
      console.log(`Scanner: Logged in as ${self.displayName}`);
    });
  }

  public async getPrejoinChatInfo(id: number | string) {
    let chat: Chat | undefined;
    let errorMessage: string | undefined = undefined;

    try {
      chat = await this._client.getChat(id);
      return { success: true, needToJoin: false, chat_id: chat.id, errorMessage } as const;
    } catch (e) {
      console.error(e);
      if ((e as Error).message?.includes("haven't joined")) {
        return { success: true, needToJoin: true, chat_id: undefined, errorMessage } as const;
      } else {
        errorMessage = (e as Error).message;
        return { success: false, needToJoin: true, chat_id: undefined, errorMessage } as const;
      }
    }
  }
}

export { MTProtoClient };
