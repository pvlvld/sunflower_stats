import type { FixBooleanProperties } from "./utilityTypes";
import { DefaultChatSettings } from "../cache/chatSettingsCache";

type IChatSettings = FixBooleanProperties<typeof DefaultChatSettings>;

export { IChatSettings };
