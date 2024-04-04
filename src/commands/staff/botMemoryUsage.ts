import type { MyContext } from "../../types/context";

function botMemoryUsage(ctx: MyContext) {
  ctx.reply(
    Object.entries(process.memoryUsage()).reduce((carry, [key, value]) => {
      return `${carry}${key}: ${Math.round((value / 1024 / 1024) * 100) / 100}MB\n`;
    }, "")
  );
}

export default botMemoryUsage;
