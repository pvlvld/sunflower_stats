import type { ChatTypeContext, CommandContext, HearsContext } from "grammy";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

export type MyContext = ParseModeFlavor<Context>;

export type MyGroupContext = ChatTypeContext<MyContext, "group" | "supergroup">;

export type GroupTextContext = CommandContext<MyGroupContext> | HearsContext<MyGroupContext>;
