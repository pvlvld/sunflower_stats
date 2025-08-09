import type { Context, NextFunction } from "grammy";
import fs from "fs";

type IBlacklistData = { users: number[]; chats: number[] };

const blacklistPath = `${process.cwd()}/data/blacklist.json`;

const _blacklist = JSON.parse(fs.readFileSync(blacklistPath, "utf-8"));

class Blacklist {
    private data: { users: number[]; chats: number[] };
    readonly middleware = blacklistMiddleware;

    constructor(data: IBlacklistData = _blacklist) {
        this.data = _blacklist;
    }

    banUser(userId: number) {
        this.data.users.push(userId);
        this.save();
    }

    banChat(chatId: number) {
        this.data.chats.push(chatId);
        this.save();
    }

    private save() {
        fs.writeFileSync(blacklistPath, JSON.stringify(this.data, null, 4));
    }
}

const blacklist = new Blacklist();
const bannedUsers = _blacklist.users;
const bannedChats = _blacklist.chats;

async function blacklistMiddleware(ctx: Context, next: NextFunction) {
    if (ctx.from && -1 != bannedUsers.indexOf(ctx.from.id)) return;
    if (ctx.chat && -1 != bannedChats.indexOf(ctx.chat.id)) {
        return void (await ctx.leaveChat().catch(console.error));
    }
    return await next();
}

export { blacklist };
