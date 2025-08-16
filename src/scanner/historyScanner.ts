import { Chat, Message, TelegramClient } from "@mtcute/node";
import { AsyncTaskQueue } from "../utils/asyncTaskQueue.js";
import { MTProtoClient } from "./MTProtoClient.js";
import formattedDate from "../utils/date.js";
import { DBStats } from "../db/stats.js";
import cfg from "../config.js";
import bot from "../bot.js";
import { active } from "../redis/active.js";
import moment from "moment";

//TODO:
// - use session pool

type IStats = Map<number, number>;
class HistoryScanner extends MTProtoClient {
    private _queue = new AsyncTaskQueue();

    constructor() {
        super(cfg.API_ID, cfg.API_HASH);
    }

    public async scanChat(identifier: string | number, chat_id: number, rescan = false): Promise<ScanReport> {
        if (this.isQueued(chat_id)) {
            return new ScanReport(identifier, false, 0, `Chat ${chat_id} / ${identifier} already in queue.`, {
                message: "history-scan-already-queued",
                variables: {},
            });
        }

        const scanTask = async () => {
            const res = await this._scanChat(identifier, chat_id, rescan);
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

    private async _scanChat(identifier: string | number, chat_id?: number, rescan = false): Promise<ScanReport> {
        const chat_id_original = chat_id!;
        const startLogMsg = `HistoryScanner: scanning ${identifier}. Queue size: ${this._queue.size}`;
        console.info(startLogMsg);
        this._log(startLogMsg);

        const chatInfo = await this.getPrejoinChatInfo(identifier);
        if (!chatInfo.success) {
            return createReportAndLeave(chat_id || -1, false, 0, "prejoin", this._client, {
                message: chatInfo.errorMessage || "error-smtn-went-wrong-call-admin",
                variables: {},
            });
        } else {
            chat_id = chatInfo.chat_id;
        }

        if (chatInfo.needToJoin) {
            chat_id = await this.joinChat(identifier);
        }

        if (!chat_id) {
            console.error(`HistoryScanner: Failed to join chat ${identifier}.`);
            return createReportAndLeave(chat_id || -1, false, 0, "", this._client, {
                message: "history-scan-cant-start",
                variables: {},
            });
        }

        let endDate: Date = new Date();
        if (rescan) {
            await DBStats.chat.dropChatStatsBeforeToday(chat_id_original);
        } else {
            endDate = (await DBStats.chat.firstRecordDate(chat_id)) || new Date();
        }

        // if (!endDate) {
        //   return createReportAndLeave(
        //     chat_id,
        //     false,
        //     0,
        //     "Не вдалось отримати дату першого повідомлення в чаті.",
        //     this._client
        //   );
        // }

        if (typeof identifier === "string" && !(identifier.startsWith("@") || !identifier.startsWith("https://"))) {
            identifier = chat_id;
        }

        const scanReport = await this._scanHistory(identifier, chat_id, endDate);
        return scanReport;
    }

    private async _scanHistory(identifier: number | string, chat_id: number, endDate: Date): Promise<ScanReport> {
        const stats: IStats = new Map<number, number>();
        let iterator = this._client.iterHistory(identifier, { reverse: true });
        let totalCount = 0;
        const firstMessageDate = await this._getFirstMessageDate(identifier);

        if (firstMessageDate === undefined) {
            console.error(`HistoryScanner: Failed to get first message date for ${identifier}.`);
            return createReportAndLeave(chat_id, false, 0, "Не вдалося отримати історію чату.", this._client, {
                message: "error-smtn-went-wrong-call-admin",
                variables: {},
            });
        }

        if (formattedDate.dateToYYYYMMDD(endDate) === "2023-12-31") {
            await DBStats.chat.removeCompiled2023Stats(chat_id);
            endDate = new Date("2024-01-01");
        }

        // if (this._isTheSameDay(firstMessageDate, endDate)) {
        //     return createReportAndLeave(
        //         chat_id,
        //         false,
        //         0,
        //         "Немає потреби в скануванні.\nДата першого запису статистики чату збігається з датою першого повідомлення в чаті.",
        //         this._client,
        //         {
        //             message: "history-scan-dont-needed",
        //             variables: {},
        //         }
        //     );
        // }

        // if (firstMessageDate > endDate) {
        //     return createReportAndLeave(
        //         chat_id,
        //         false,
        //         0,
        //         "Перше збережене в статистиці повідомлення старіше за перше доступне в чаті.",
        //         this._client,
        //         {
        //             message: "history-scan-first-known-msg-older-than-chat",
        //             variables: {},
        //         }
        //     );
        // }

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
                    // if (this._isTheSameDay(currentMsgDate, endDate)) {
                    //     console.log("exit on date:", currentMsgDate, endDate);
                    //     break main_loop;
                    // }

                    if (this._isAfter(currentMsgDate, endDate)) {
                        console.log(`Reached beginning scan time point.\nCurrent: ${currentMsgDate} End: ${endDate}`);
                        break main_loop;
                    }

                    // Each new day perform stats writing
                    if (!this._isTheSameDay(currentMsgDate, previousMsgDate)) {
                        previousMsgDate = currentMsgDate;
                        await this._writeHistoryStats(chat_id, stats, message.date);
                    }

                    stats.set(message.sender.id, (stats.get(message.sender.id) || 0) + 1);
                    totalCount++;
                }
                break main_loop;
            } catch (error: any) {
                if ("seconds" in error) {
                    console.info(`HistoryScanner: Sleeping for ${error.seconds} seconds. Target: ${identifier}`);
                    await new Promise((resolve) => setTimeout(resolve, error.seconds * 1000));
                    iterator = this._client.iterHistory(identifier, {
                        reverse: true,
                        offset: { id: lastScannedMsgId, date: currentMsgDate.getTime() },
                    });
                } else {
                    console.error(`HistoryScanner: Error while scanning ${identifier}:`, error);
                    return createReportAndLeave(chat_id, false, totalCount, "Unknown error.", this._client, {
                        message: "error-smtn-went-wrong-call-admin",
                        variables: {},
                    });
                }
            }
        }

        return createReportAndLeave(chat_id, true, totalCount, "", this._client, {
            message: "history-scan-finished",
            variables: { count: totalCount.toString() },
        });
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
        const date = (await this._client.getHistory(identifier, { reverse: true, limit: 1 }).catch((e) => {}))?.[0]
            ?.date;
        console.info(`HistoryScanner: _getFirstMessageDate: ${date}, ${identifier}`);
        return date;
    }

    private _isTheSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }

    private async _writeHistoryStats(chat_id: number, stats: IStats, date: Date) {
        if (stats.size === 0) {
            return;
        }
        let string_date = "";

        for (const [id, count] of stats) {
            string_date = formattedDate.dateToYYYYMMDD(date);

            // TODO: Optimize. It runs in the loop. Some local state to minimize redis access.
            // Update first seen date
            const user = await active.getUser(chat_id, id);
            if (!user || moment(user.active_first).diff(string_date) > 0) {
                await active.updateUserField(chat_id, id, "active_first", string_date);
            }

            await DBStats.user.countUserMessage(chat_id, id, count, string_date);
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
    error: string,
    client: TelegramClient,
    localeError: { message: string; variables: { [key: string]: string } }
) {
    bot.api
        .sendMessage(cfg.ANALYTICS_CHAT, `Successfully scanned ${count} msg in ${identifier}`, {
            message_thread_id: 3123,
        })
        .catch((e) => {});
    client.leaveChat(identifier).catch((e) => {});
    return new ScanReport(identifier, status, count, error, localeError);
}

class ScanReport {
    constructor(
        public identifier: number | string,
        public status: boolean,
        public count: number,
        public error: string,
        public localeError: { message: string; variables: { [key: string]: string } }
    ) {}
}

const historyScanner = new HistoryScanner();

export { historyScanner };
