type IChatAdminStatus = "administrator" | "creator";

interface IChatAdmin {
  user_id: number;
  status: IChatAdminStatus;
}

class ChatAdminsCache {
  private _adminsCache: Record<number, IChatAdmin[] | undefined> = {};

  public getAdmins(chat_id: number): IChatAdmin[] {
    return this._adminsCache[chat_id] ?? [];
  }

  public setAdmins(chat_id: number, admins: IChatAdmin[]): void {
    this._adminsCache[chat_id] = admins;
  }

  public isAdmin(chat_id: number, user_id: number): boolean {
    return this.getAdmins(chat_id).some((admin) => admin.user_id === user_id);
  }

  public isCreator(chat_id: number, user_id: number): boolean {
    return this.getAdmins(chat_id).some(
      (admin) => admin.user_id === user_id && admin.status === "creator"
    );
  }

  public removeAdmin(chat_id: number, user_id: number): IChatAdmin[] {
    const updatedAdmins = this.getAdmins(chat_id).filter((admin) => admin.user_id !== user_id);
    this._adminsCache[chat_id] = updatedAdmins;
    return updatedAdmins;
  }

  public addAdmin(chat_id: number, admin: IChatAdmin): void {
    const admins = this.removeAdmin(chat_id, admin.user_id);
    admins.push(admin);
    this.setAdmins(chat_id, admins);
  }

  public getAdmin(chat_id: number, user_id: number): IChatAdmin | undefined {
    return this.getAdmins(chat_id).find((admin) => admin.user_id === user_id);
  }

  public isCached(chat_id: number) {
    return this._adminsCache[chat_id] !== undefined;
  }

  public get size() {
    return Object.keys(this._adminsCache).length;
  }
}

export { ChatAdminsCache, IChatAdmin };
