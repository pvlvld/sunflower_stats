import { TelegramClient } from "@mtcute/node";

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

  public async getChat(id: number | string) {
    let chat: Chat | undefined;
    let errorMessage: string = "";

    try {
      chat = await this._client.getChat(id);
    } catch (e) {
      if ((e as Error).message?.includes("haven't joined")) {
        errorMessage = "Сканер не зміг отримати інформацію про чат. Можливо він заблокований.";
      } else {
        errorMessage = (e as Error).message;
      }

      return { status: false, chat: undefined, errorMessage } as const;
    }

    return { status: true, chat: chat, errorMessage } as const;
  }
}

export { MTProtoClient };
