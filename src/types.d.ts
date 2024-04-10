import type { ChatTypeContext, Context, HearsContext, CommandContext } from "grammy";

type IGroupContext = ChatTypeContext<Context, "group" | "supergroup">;

export type IContext = Context;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;
