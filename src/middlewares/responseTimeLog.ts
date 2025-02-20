import type { Context, NextFunction } from "grammy";

export async function responseTimeLog(ctx: Context, next: NextFunction) {
    const start = Date.now();
    await next();
    console.log(`Response time: ${Date.now() - start} ms`);
}
