import type { ChatTypeContext, Context, HearsContext, CommandContext, Filter } from "grammy";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { FileFlavor } from "@grammyjs/files";
import type { Update } from "grammy/types";

export type IContext = FileFlavor<ParseModeFlavor<Context>>;

export type IGroupContext = ChatTypeContext<IContext, "supergroup" | "group">;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;

export type IGroupTextContext = Filter<IGroupContext, ":text" | ":caption">;

export type IUpdates = ReadonlyArray<Exclude<keyof Update, "update_id">>;
