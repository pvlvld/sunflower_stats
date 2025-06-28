import type { ChatTypeContext, Context, HearsContext, CommandContext, Filter, Api } from "grammy";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { FileApiFlavor, FileFlavor } from "@grammyjs/files";
import type { Update } from "grammy/types";
import { I18nFlavor } from "@grammyjs/i18n";

export type IContext = FileFlavor<ParseModeFlavor<Context>> & I18nFlavor;

export type ITextContext = Filter<IContext, ":text" | ":caption">;

export type IGroupContext = ChatTypeContext<IContext, "supergroup" | "group">;

export type IGroupMyChatMemberContext = Filter<IGroupContext, "my_chat_member">;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type ICommandContext = CommandContext<IContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;

export type IGroupTextContext = Filter<IGroupContext, ":text" | ":caption">;

export type IGroupCaptionContext = Filter<IGroupContext, ":caption">;

export type IGroupPhotoCaptionContext = Filter<IGroupCaptionContext, ":photo">;

export type IGroupAnimationCaptionContext = Filter<IGroupCaptionContext, ":animation">;

export type IUpdates = ReadonlyArray<Exclude<keyof Update, "update_id">>;

export type IApi = FileApiFlavor<Api>;
