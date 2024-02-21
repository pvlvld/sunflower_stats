import type { User } from "@grammyjs/types";
import type { ChatTypeContext, Filter } from "grammy";
import type { Context } from "grammy";

export type MyContext = Context;

export type MyGroupContext = ChatTypeContext<MyContext, "group" | "supergroup">;

export type GroupTextContext = Filter<
  MyGroupContext,
  ":text" | "edited_message:text" | ":caption"
>;
