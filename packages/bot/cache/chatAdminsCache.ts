import { GrammyError } from "grammy";
import bot from "../bot.js";
import cfg from "../config.js";
import { chatMigrationHandler } from "../handlers/chatMigrationHandler.js";

type IChatAdminStatus = "administrator" | "creator";

interface IChatAdmin {
    user_id: number;
    status: IChatAdminStatus;
}

class ChatAdminsCache {
    private _adminsCache: Record<number, IChatAdmin[] | undefined> = {};

    public getAdmins(chat_id: number): IChatAdmin[] {
        const admins = this._adminsCache[chat_id] ?? [];
        if (cfg.LOG_LVL.get() > 1) {
            console.log("Admins:", chat_id, admins);
        }
        return admins;
    }

    public setAdmins(chat_id: number, admins: IChatAdmin[]) {
        return (this._adminsCache[chat_id] = admins);
    }

    public isAdmin(chat_id: number, user_id: number): boolean {
        return this.getAdmins(chat_id).some((admin) => admin.user_id === user_id);
    }

    public isCreator(chat_id: number, user_id: number): boolean {
        return this.getAdmins(chat_id).some(
            (admin) => admin.user_id === user_id && admin.status === "creator",
        );
    }

    public removeAdmin(chat_id: number, user_id: number): IChatAdmin[] {
        return this.setAdmins(
            chat_id,
            this.getAdmins(chat_id).filter((admin) => admin.user_id !== user_id),
        );
    }

    public async addAdmin(chat_id: number, admin: IChatAdmin): Promise<IChatAdmin[]> {
        let admins = this.removeAdmin(chat_id, admin.user_id);
        if (admins.some((a) => a.status === "creator")) {
            admins.push(admin);
        } else {
            admins = await this.updateAdmins(chat_id);
        }
        return this.setAdmins(chat_id, admins);
    }

    public getAdmin(chat_id: number, user_id: number): IChatAdmin | undefined {
        return this.getAdmins(chat_id).find((admin) => admin.user_id === user_id);
    }

    public isCached(chat_id: number) {
        return this._adminsCache[chat_id] !== undefined;
    }

    public async updateAdmins(chat_id: number) {
        const apiAdmins = await bot.api.getChatAdministrators(chat_id).catch(async (e) => {
            if (e instanceof GrammyError) {
                if (e.parameters.migrate_to_chat_id) {
                    await chatMigrationHandler.handleFromError(e);
                    return await bot.api
                        .getChatAdministrators(e.parameters.migrate_to_chat_id)
                        .catch((e) => {});
                }
            }

            console.error("Error caching chat admins.", e);
        });
        const admins: IChatAdmin[] = [];

        if (apiAdmins === undefined) {
            return admins;
        }

        for (const admin of apiAdmins) {
            admins.push({ user_id: admin.user.id, status: admin.status });
        }

        return this.setAdmins(chat_id, admins);
    }

    public get size() {
        return Object.keys(this._adminsCache).length;
    }
}

export { ChatAdminsCache, IChatAdmin };
