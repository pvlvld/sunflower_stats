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
}

export { MTProtoClient };
