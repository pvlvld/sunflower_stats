import { DefaultUserSettings, IUserSettings } from "../consts/defaultUserSettings.js";

class UserSettingsCache {
    private _settingsCache: Record<number, IUserSettings | undefined>;

    constructor() {
        this._settingsCache = {};
    }

    public get(user_id: number): IUserSettings | undefined {
        return this._settingsCache[user_id];
    }

    public set(user_id: number, settings: Partial<IUserSettings> | undefined): IUserSettings {
        if (this._settingsCache[user_id] === undefined) {
            this._settingsCache[user_id] = { ...DefaultUserSettings };
        }

        if (settings) {
            this._settingsCache[user_id] = {
                ...this._settingsCache[user_id],
                ...settings,
            };
        }

        return this._settingsCache[user_id];
    }

    public get size() {
        return Object.keys(this._settingsCache).length;
    }
}

export { UserSettingsCache };
