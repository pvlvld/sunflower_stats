import { Chat, networkMiddlewares, SqliteStorage, TelegramClient } from "@mtcute/node";

class MTProtoClient {
    protected _client: TelegramClient;

    constructor(apiId: number, apiHash: string) {
        this._client = new TelegramClient({
            apiId,
            apiHash,
            logLevel: 1,
            network: {
                middlewares: networkMiddlewares.basic({
                    floodWaiter: { maxWait: Infinity, minStoredWait: 1 },
                }),
            },
            disableUpdates: true,
            updates: { catchUp: false },
            storage: new SqliteStorage("client.session"),
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
            if ((e as Error).message?.includes("haven't joined")) {
                console.error("Chat not joined or invalid ID/username provided:", id);
                return {
                    success: true,
                    needToJoin: true,
                    chat_id: undefined,
                    errorMessage: "error-smtn-went-wrong-call-admin",
                };
            }

            if ((e as Error).message?.includes("link has expired")) {
                console.error("Chat link has expired or is invalid:", id);
                return {
                    success: false,
                    needToJoin: true,
                    chat_id: undefined,
                    error: "error-smtn-went-wrong-call-admin",
                };
            }

            if ((e as Error).message?.includes("provided username is not valid")) {
                console.error("Invalid username or chat ID provided:", id);
                return {
                    success: true,
                    needToJoin: true,
                    chat_id: undefined,
                    errorMessage: "error-smtn-went-wrong-call-admin",
                };
            }

            console.error(`getPrejoinChatInfo ID: ${id} err:`, e);
            errorMessage = (e as Error).message;
            return { success: false, needToJoin: true, chat_id: undefined, errorMessage } as const;
        }
    }
}

export { MTProtoClient };
