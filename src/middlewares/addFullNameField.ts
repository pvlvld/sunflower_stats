import type { NextFunction } from "grammy";
import type { MyContext } from "../types/context";

export async function addFullNameField(ctx: MyContext, next: NextFunction) {
  if (ctx.from) {
    ctx.from.full_name = `${ctx.from.first_name} ${
      ctx.from.last_name || ""
    }`.trim();
  }

  await next();
}
