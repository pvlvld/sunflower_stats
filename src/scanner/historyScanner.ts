import { Message, MtPeerNotFoundError } from "@mtcute/node";
import { MTProtoClient } from "./MTProtoClient";
import formattedDate from "../utils/date";
import { DBStats } from "../db/stats";
import cfg from "../config";

//TODO:
// - implement queue
// - use session pool
// - add logs

type IStats = Map<number, number>;
class HistoryScanner extends MTProtoClient {
  constructor() {
    super(cfg.API_ID, cfg.API_HASH);
  }

  public async scanChat(chatIdentifier: string, chat_id?: number): Promise<ScanReport> {
    const chatInfo = await this.getBaseChatInfo(chatIdentifier as string);

    if (chatInfo.needToJoin) {
      try {
        const chat_info = await this.joinChat(chatIdentifier);
        chat_id = chat_info.id;
      } catch (error) {
        return new ScanReport(false, 0, "Не вдалось доєднатися до чату.");
      }
    } else {
      if (chatInfo.chatInfo) {
        chat_id = chatInfo.chatInfo.id;
      }
    }

    if (!chat_id) {
      return new ScanReport(false, 0, `Не вдалось отримати інформацію про чат ${chatIdentifier}`);
    }

    const endDate = await DBStats.chat.firstRecordDate(chat_id);

    if (endDate === undefined) {
      return new ScanReport(false, 0, "Не вдалось отримати дату першого повідомлення в чаті.");
    }

    return this._scanner(chatIdentifier, chat_id, endDate);
  }

  private async _scanner(chatIdentifier: number | string, chatId: number, endDate: Date) {
    const stats = new Map<number, number>();
    let iterator = this._client.iterHistory(chatIdentifier, { reverse: true });
    let message: Message | undefined;
    let totalCount = 0;
    let userMsgCount = 0;
    const firstMessageDate = await this._getFirstMessageDate(chatIdentifier);
    let currentMsgDate = firstMessageDate!;
    let previousMsgDate = firstMessageDate!;
    let lastScannedMsgId = 0;

    if (firstMessageDate === undefined) {
      return new ScanReport(false, 0, "Не вдалося отримати історію чату.");
    }

    main_loop: while (true) {
      try {
        for await (message of iterator) {
          lastScannedMsgId = message.id;
          currentMsgDate = message.date;

          if (message.sender.type === "chat") {
            continue;
          }

          // Reached end
          if (message === undefined) {
            break main_loop;
          }

          // Reached endDate (first stats record date of the chat)
          if (!this._isDifferentDay(currentMsgDate, endDate)) {
            console.log("exit on date:", currentMsgDate, endDate);
            break main_loop;
          }

          // Each new day perform stats writing
          if (this._isDifferentDay(currentMsgDate, previousMsgDate)) {
            previousMsgDate = currentMsgDate;
            await this._writeHistoryStats(chatId, stats, message.date);
          }

          userMsgCount = stats.get(message.sender.id) || 0;
          stats.set(message.sender.id, ++userMsgCount);
          totalCount++;
        }
        break main_loop;
      } catch (error: any) {
        if ("seconds" in error) {
          console.info(`HistoryScanner: Sleeping for ${error.seconds} seconds.`);
          await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
          iterator = this._client.iterHistory(chatIdentifier, {
            reverse: true,
            offset: { id: lastScannedMsgId, date: currentMsgDate.getTime() },
          });
        } else {
          return new ScanReport(false, totalCount, error);
        }
      }
    }

    return new ScanReport(true, totalCount);
  }

  public async joinChat(chat: string | number) {
    return await this._client.joinChat(chat);
  }

  private async getBaseChatInfo(chat: string | number) {
    if (typeof chat === "number") {
      return { needToJoin: false, chatInfo: undefined } as const;
    }

    if (chat.startsWith("@")) {
      return { needToJoin: false, chatInfo: await this._client.getChat(chat) } as const;
    }

    const preview = await this._client.getChatPreview(chat).catch((e) => {
      if (e instanceof MtPeerNotFoundError) {
        if (e.message.includes("already joined")) {
          return "already joined";
        }
      }
    });

    if (preview === "already joined") {
      return { needToJoin: false, chatInfo: undefined } as const;
    }

    return { needToJoin: true, chatInfo: preview } as const;
  }

  public async leaveChat(chat: string | number) {
    return await this._client.leaveChat(chat);
  }

  private async _getFirstMessageDate(chatId: string | number) {
    return (
      await this._client.getHistory(chatId, { reverse: true, limit: 1 }).catch((e) => {})
    )?.[0]?.date;
  }

  private _isDifferentDay(date1: Date, date2: Date) {
    return (
      date1.getDate() !== date2.getDate() ||
      date1.getMonth() !== date2.getMonth() ||
      date1.getFullYear() !== date2.getFullYear()
    );
  }

  private async _writeHistoryStats(chat_id: number, stats: IStats, date: Date) {
    if (stats.size === 0) {
      return;
    }

    const yyyymmddDate = formattedDate.dateToYYYYMMDD(date);
    for (const [id, count] of stats) {
      await DBStats.user.countUserMessage(chat_id, id, count, yyyymmddDate);
    }

    stats.clear();
  }
}

class ScanReport {
  public status: boolean;
  public count: number;
  public error: string;
  constructor(status: boolean, count: number, error?: Error | string) {
    this.status = status;
    this.count = count;
    this.error = "";
  }
}

const historyScanner = new HistoryScanner();

export { historyScanner };
