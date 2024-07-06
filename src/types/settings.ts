import { DefaultChatSettings } from "../cache/chatSettingsCache.js";
import type { FixBooleanProperties } from "./utilityTypes.js";

type IChatSettings = FixBooleanProperties<typeof DefaultChatSettings>;

export { IChatSettings };
