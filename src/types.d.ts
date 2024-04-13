import type { ChatTypeContext, Context, HearsContext, CommandContext } from "grammy";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Update } from "grammy/types";

export type IContext = ParseModeFlavor<Context>;

export type IGroupContext = ChatTypeContext<IContext, "group" | "supergroup">;

export type IGroupHearsContext = HearsContext<IGroupContext>;

export type IGroupCommandContext = CommandContext<IGroupContext>;

export type IGroupHearsCommandContext = IGroupHearsContext | IGroupCommandContext;

export type IUpdates = ReadonlyArray<Exclude<keyof Update, "update_id">>;
