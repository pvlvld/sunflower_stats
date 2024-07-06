import type { Context, NextFunction } from "grammy";
//@ts-expect-error
import Big from "big-js";

export async function responseTimeLog(ctx: Context, next: NextFunction) {
  const start = String(process.hrtime.bigint());
  await next();
  const ms = new Big(String(process.hrtime.bigint())).minus(start).div(1000000);
  console.log(`Response time: ${ms.toString()} ms`);
}
