import type { ChatTypeContext, CommandContext, HearsContext } from "grammy";
import type { Context } from "grammy";

export type MyContext = Context;

export type MyGroupContext = ChatTypeContext<MyContext, "group" | "supergroup">;

export type GroupTextContext = CommandContext<MyGroupContext> | HearsContext<MyGroupContext>;
