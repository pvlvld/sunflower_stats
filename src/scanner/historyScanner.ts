import { Chat, Message, TelegramClient } from "@mtcute/node";
import { AsyncTaskQueue } from "../utils/asyncTaskQueue.js";
import { MTProtoClient } from "./MTProtoClient.js";
import formattedDate from "../utils/date.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";
import bot from "../bot.js";

//TODO:
// - use session pool

type IStats = Map<number, number>;
class HistoryScanner extends MTProtoClient {
  private _queue = new AsyncTaskQueue();

  constructor() {
    super(cfg.API_ID, cfg.API_HASH);
  }

  public async scanChat(identifier: string | number, chat_id: number) {
    if (this.isQueued(chat_id)) {
      return new ScanReport(
        identifier,
        false,
        0,
        `Чат ${chat_id} / ${identifier} вже в черзі на сканування.`
      );
    }

    const scanTask = async () => {
      const res = await this._scanChat(identifier, chat_id);
      const endScanLog = `HistoryScanner: finished scanning ${identifier}. ${res.count} messages${
        res.error ? `, err: ${res.error}` : ""
      }.`;
      console.info(endScanLog);
      this._log(endScanLog);

      return res;
    };

    console.info(`HistoryScanner: queued ${identifier} scan.`);
    return await this._queue.enqueue(scanTask, chat_id);
  }

  private async _scanChat(identifier: string | number, chat_id?: number): Promise<ScanReport> {
    const startLogMsg = `HistoryScanner: scanning ${identifier}. Queue size: ${this._queue.size}`;
    console.info(startLogMsg);
    this._log(startLogMsg);

    const chatInfo = await this.getPrejoinChatInfo(identifier);
    if (!chatInfo.success) {
      return createReportAndLeave(
        chat_id || -1,
        false,
        0,
        chatInfo.errorMessage || "Prejoin failed",
        this._client
      );
    } else {
      chat_id = chatInfo.chat_id;
    }

    if (chatInfo.needToJoin) {
      chat_id = await this.joinChat(identifier);
    }

    if (!chat_id) {
      return createReportAndLeave(
        chat_id || -1,
        false,
        0,
        `Не вдалось отримати інформацію про чат ${identifier}`,
        this._client
      );
    }

    const endDate = (await DBStats.chat.firstRecordDate(chat_id)) || new Date();

    // if (!endDate) {
    //   return createReportAndLeave(
    //     chat_id,
    //     false,
    //     0,
    //     "Не вдалось отримати дату першого повідомлення в чаті.",
    //     this._client
    //   );
    // }

    if (typeof identifier === "string" && !identifier.startsWith("@")) {
      identifier = chat_id;
    }

    const scanReport = await this._scanHistory(identifier, chat_id, endDate);
    return scanReport;
  }

  private async _scanHistory(
    identifier: number | string,
    chat_id: number,
    endDate: Date
  ): Promise<ScanReport> {
    const stats: IStats = new Map<number, number>();
    let iterator = this._client.iterHistory(identifier, { reverse: true });
    let totalCount = 0;
    const firstMessageDate = await this._getFirstMessageDate(identifier);

    if (firstMessageDate === undefined) {
      return createReportAndLeave(
        chat_id,
        false,
        0,
        "Не вдалося отримати історію чату.",
        this._client
      );
    }

    if (formattedDate.dateToYYYYMMDD(endDate) === "2023-12-31") {
      await DBStats.chat.removeCompiled2023Stats(chat_id);
      endDate = new Date("2024-01-01");
    }

    if (!this._isDifferentDay(firstMessageDate, endDate)) {
      return createReportAndLeave(
        chat_id,
        false,
        0,
        "Немає потреби в скануванні.\nДата першого запису статистики чату збігається з датою першого повідомлення в чаті.",
        this._client
      );
    }

    if (firstMessageDate > endDate) {
      return createReportAndLeave(
        chat_id,
        false,
        0,
        "Перше збережене в статистиці повідомлення старіше за перше доступне в чаті.",
        this._client
      );
    }

    let message: Message | undefined;
    let currentMsgDate = firstMessageDate!;
    let previousMsgDate = firstMessageDate!;
    let lastScannedMsgId = 0;
    main_loop: while (true) {
      try {
        for await (message of iterator) {
          lastScannedMsgId = message.id;
          currentMsgDate = message.date;

          if (message.sender.type === "chat") {
            continue;
          }

          // Reached end
          if (!message) {
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
            await this._writeHistoryStats(chat_id, stats, message.date);
          }

          stats.set(message.sender.id, (stats.get(message.sender.id) || 0) + 1);
          totalCount++;
        }
        break main_loop;
      } catch (error: any) {
        if ("seconds" in error) {
          console.info(
            `HistoryScanner: Sleeping for ${error.seconds} seconds. Target: ${identifier}`
          );
          await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
          iterator = this._client.iterHistory(identifier, {
            reverse: true,
            offset: { id: lastScannedMsgId, date: currentMsgDate.getTime() },
          });
        } else {
          return createReportAndLeave(chat_id, false, totalCount, "", this._client);
        }
      }
    }

    return createReportAndLeave(chat_id, true, totalCount, "", this._client);
  }

  public async joinChat(identifier: string | number): Promise<number | undefined> {
    let chat: Chat;
    try {
      chat = await this._client.joinChat(identifier);
      return chat.id;
    } catch (e) {
      return undefined;
    }
  }

  public async leaveChat(identifier: string | number) {
    return await this._client.leaveChat(identifier).catch((e) => {});
  }

  private async _getFirstMessageDate(identifier: string | number) {
    const date = (
      await this._client.getHistory(identifier, { reverse: true, limit: 1 }).catch((e) => {})
    )?.[0]?.date;
    console.info(`HistoryScanner: _getFirstMessageDate: ${date}, ${identifier}`);
    return date;
  }

  private _isDifferentDay(date1: Date, date2: Date): boolean {
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

    for (const [id, count] of stats) {
      await DBStats.user.countUserMessage(chat_id, id, count, formattedDate.dateToYYYYMMDD(date));
    }

    stats.clear();
  }

  private async _log(message: string) {
    bot.api
      .sendMessage(cfg.ANALYTICS_CHAT, message, {
        message_thread_id: 3123,
      })
      .catch((e) => {});
  }

  public isQueued(identifier: string | number) {
    return this._queue.has(identifier);
  }
}

function createReportAndLeave(
  identifier: number | string,
  status: boolean,
  count: number,
  error: Error | string,
  client: TelegramClient
) {
  bot.api
    .sendMessage(cfg.ANALYTICS_CHAT, `Відскановано ${count} повідомлень в  ${identifier}`, {
      message_thread_id: 3123,
    })
    .catch((e) => {});
  client.leaveChat(identifier).catch((e) => {});
  return new ScanReport(identifier, status, count, error);
}

class ScanReport {
  constructor(
    public identifier: number | string,
    public status: boolean,
    public count: number,
    public error: Error | string
  ) {}
}

const historyScanner = new HistoryScanner();

export { historyScanner };
