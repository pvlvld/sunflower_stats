import type { Context, NextFunction } from "grammy";

const afterSeconds = 30;

function dateInSeconds() {
  return Math.round(Date.now() / 1000);
}

export async function ignoreOldMessages(ctx: Context, next: NextFunction) {
  if (!ctx.msg) return await next();

  if (dateInSeconds() - ctx.msg.date < afterSeconds) {
    return await next();
  }
}
