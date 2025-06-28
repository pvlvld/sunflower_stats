import { DefaultUserSettings } from "./defaultUserSettings.js";
import { FixBooleanProperties } from "../types/utilityTypes.js";

const DefaultChatSettings = Object.freeze(
    Object.assign(
        {
            charts: true,
            statsadminsonly: false,
            usechatbgforall: false,
            selfdestructstats: false,
            userstatslink: true,
        },
        DefaultUserSettings
    )
);

type IChatSettings = FixBooleanProperties<typeof DefaultChatSettings>;

export { DefaultChatSettings, IChatSettings };
