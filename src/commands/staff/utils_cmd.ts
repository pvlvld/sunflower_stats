import type { IContext } from "../../types/context.js";
import { active } from "../../data/active.js";

export function removeAnonimousActive(ctx: IContext) {
  let hidedCount = 0;
  for (const chat_id in active.data) {
    for (const user_id in active.data[chat_id]) {
      if ([136817688, 777000].includes(+user_id)) {
        delete active.data[chat_id]?.[user_id];
        hidedCount++;
      }
    }
  }

  ctx.reply(`Done! Hided ${hidedCount} anonimous members`).catch(() => {});
}
