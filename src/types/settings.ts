import type { Writeable } from "./writeable";
import { DefaultChatSettings } from "../cache/chatSettingsCache";

type IChatSettings = Writeable<typeof DefaultChatSettings>;

export { IChatSettings };
