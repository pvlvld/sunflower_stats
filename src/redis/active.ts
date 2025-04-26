import Redis from "ioredis";
import * as OldActive from "../data/active.js";
import { getUserFirstStatsDate } from "../utils/getUserFirstStatsDate.js";
import formattedDate from "../utils/date.js";

interface IActiveUser {
    active_first: string; // YYYY-MM-DD
    active_last: string; // YYYY-MM-DD
    name: string;
    nickname: string | null;
    username: string | null;
}

const VALID_USER_KEYS: (keyof IActiveUser)[] = ["active_last", "nickname", "name", "username", "active_first"];

class ChatUserStore {
    private redis: Redis.Redis;

    constructor(redisUrl: string = "redis://localhost:6379") {
        this.redis = new Redis.Redis(redisUrl, {
            keyPrefix: "active:",
        });
    }

    private getChatKey(chatId: number): string {
        return `chat:${chatId}`;
    }

    private getUserKey(chatId: number, userId: number): string {
        return `chat:${chatId}:user:${userId}`;
    }

    /**
     * Upsert a user in a chat
     * Note: Empty string values will be treated as undefined/null in output
     */
    async upsertUser(
        chatId: number,
        userId: number,
        active_first: string,
        active_last: string,
        name: string,
        nickname: string,
        username: string
    ): Promise<void> {
        const userKey = this.getUserKey(chatId, userId);
        const chatKey = this.getChatKey(chatId);

        const multi = this.redis.multi();

        const userDataToStore: Record<string, string> = {
            active_first,
            active_last,
            name,
            nickname,
            username,
        };

        // Check if user already exists
        const userExists = await this.redis.exists(userKey);

        if (userExists) {
            // If user exists, need to preserve nick if not updating
            if (nickname === "") delete userDataToStore.nickname;
            if (active_first === "") delete userDataToStore.active_first;

            // Only set the non-empty fields
            const fieldsToUpdate: Record<string, string> = {};
            for (const [key, value] of Object.entries(userDataToStore)) {
                if (key !== "nickname" || value !== "") {
                    fieldsToUpdate[key] = value;
                }
            }

            if (Object.keys(fieldsToUpdate).length > 0) {
                multi.hmset(userKey, fieldsToUpdate);
            }
        } else {
            multi.hmset(userKey, userDataToStore);
        }

        // ALWAYS add user to the chat's user set, regardless of whether they existed before
        multi.sadd(chatKey, userId.toString());

        await multi.exec();
    }

    async updateUserField(chatId: number, userId: number, key: keyof IActiveUser, value: string | null): Promise<void> {
        const userKey = this.getUserKey(chatId, userId);

        if (!VALID_USER_KEYS.includes(key)) throw new Error(`Invalid user field: ${key}`);

        if (value === null || value === undefined) {
            await this.redis.hset(userKey, key, "");
        } else {
            await this.redis.hset(userKey, key, value);
        }
    }

    async getUser(chatId: number, userId: number): Promise<IActiveUser | null> {
        const userKey = this.getUserKey(chatId, userId);

        const userData = (await this.redis.hgetall(userKey)) as Record<string, string>;

        if (Object.keys(userData).length === 0) {
            return null;
        }

        // If active_first is empty, set it to the first stats date or today
        if (!userData.active_first) {
            const dbActiveFirstDate = await getUserFirstStatsDate(chatId, userId);

            if (dbActiveFirstDate) {
                userData.active_first = dbActiveFirstDate;
            } else {
                userData.active_first = formattedDate.today[0];
            }
        }

        return {
            active_first: userData.active_first,
            active_last: userData.active_last,
            name: userData.name,
            nickname: userData.nickname === "" ? null : userData.nickname,
            username: userData.username === "" ? null : userData.username,
        };
    }

    async getChatUsers(chatId: number): Promise<Record<string, IActiveUser>> {
        const chatKey = this.getChatKey(chatId);
        const userIds = await this.redis.smembers(chatKey);
        if (userIds.length === 0) return {};

        const multi = this.redis.multi();

        for (const userId of userIds) {
            multi.hgetall(this.getUserKey(chatId, parseInt(userId, 10)));
        }

        const results = (await multi.exec()) as [error: Error | null, result: IActiveUser][] | null;
        if (!results) return {};

        const users: Record<string, IActiveUser> = {};

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const [err, userData] = results[i];

            if (err || !userData || Object.keys(userData).length === 0) continue;

            users[userId] = {
                active_first: userData.active_first,
                active_last: userData.active_last,
                name: userData.name,
                nickname: userData.nickname === "" ? null : userData.nickname,
                username: userData.username === "" ? null : userData.username,
            };
        }

        return users;
    }

    async removeChat(chatId: number): Promise<void> {
        const chatKey = this.getChatKey(chatId);

        const userIds = await this.redis.smembers(chatKey);

        const multi = this.redis.multi();

        for (const userId of userIds) {
            const userKey = this.getUserKey(chatId, parseInt(userId, 10));
            multi.del(userKey);
        }

        multi.del(chatKey);

        await multi.exec();
    }

    async removeUser(chatId: number, userId: number): Promise<boolean> {
        const userKey = this.getUserKey(chatId, userId);
        const chatKey = this.getChatKey(chatId);

        const multi = this.redis.multi();

        multi.del(userKey);

        multi.srem(chatKey, userId.toString());

        return !!(await multi.exec())?.[1][1];
    }

    async getAllChatIds(): Promise<number[]> {
        const chatKeys: string[] = [];
        let cursor = "0";

        do {
            // SCAN through keys with pattern "chat:*" but exclude user keys
            // Using "chat:*" pattern to match both positive and negative IDs
            const reply = await this.redis.scan(cursor, "MATCH", "chat:*", "COUNT", 1000);

            cursor = reply[0];
            const keys = reply[1];

            // Filter out any keys that might contain ":user:" to ensure we only get chat set keys
            const filteredKeys = keys.filter((key) => !key.includes(":user:"));
            chatKeys.push(...filteredKeys);
        } while (cursor !== "0");

        // Extract the chat IDs from the keys
        return chatKeys
            .map((key) => {
                // Extract the number after "chat:" - handle both positive and negative numbers
                const match = key.match(/^chat:(-?\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((id) => id !== 0);
    }

    async migrateChatId(oldId: number, newId: number): Promise<void> {
        const oldChatKey = this.getChatKey(oldId);
        const newChatKey = this.getChatKey(newId);

        const userIds = await this.redis.smembers(oldChatKey);
        if (userIds.length === 0) throw new Error(`No users found for chat ID ${oldId}`);

        const multi = this.redis.multi();

        for (const userId of userIds) {
            const oldUserKey = this.getUserKey(oldId, parseInt(userId, 10));
            multi.hgetall(oldUserKey);
        }

        const userDataResults = await multi.exec();
        if (!userDataResults) throw new Error("Failed to fetch user data");

        multi.reset();

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const [, userData] = userDataResults[i];
            const newUserKey = this.getUserKey(newId, parseInt(userId, 10));
            if (userData && Object.keys(userData).length > 0) {
                multi.hmset(newUserKey, userData);
                multi.sadd(newChatKey, userId);
            }
        }

        multi.del(oldChatKey);
        for (const userId of userIds) {
            const oldUserKey = this.getUserKey(oldId, parseInt(userId, 10));
            multi.del(oldUserKey);
        }

        await multi.exec();
    }

    async close(): Promise<void> {
        await this.redis.quit();
    }

    async seedFromYAML() {
        const chats = Object.keys(OldActive.active.data);
        let users = [];
        let user = {} as OldActive.IActiveUser | undefined;
        for (const chatId of chats) {
            users = Object.keys(OldActive.active.data[chatId]!);
            for (const userId of users) {
                user = OldActive.active.data[chatId]![userId];
                if (user?.name && user?.active_first && user?.active_last) {
                    await this.upsertUser(
                        parseInt(chatId, 10),
                        parseInt(userId, 10),
                        user.active_first,
                        user.active_last,
                        user.name,
                        user.nickname || "",
                        user.username || ""
                    );
                }
            }
        }
    }
}

const active = new ChatUserStore();
export { ChatUserStore, active, IActiveUser };
