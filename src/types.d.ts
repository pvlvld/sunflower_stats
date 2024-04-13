import type { ChatTypeContext, Context, HearsContext, CommandContext } from "grammy";
import type { Update } from "grammy/types";

export type IContext = Context;

export type IGroupContext = ChatTypeContext<IContext, "group" | "supergroup">;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;

export type IUpdates = ReadonlyArray<Exclude<keyof Update, "update_id">>;
