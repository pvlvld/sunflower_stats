import type { ChatTypeContext, Context, HearsContext, CommandContext } from "grammy";
import type { Update } from "grammy/types";

type IGroupContext = ChatTypeContext<Context, "group" | "supergroup">;

export type IContext = Context;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;

export type IUpdates = ReadonlyArray<Exclude<keyof Update, "update_id">>;
