import type YAMLWrapper from "../../data/YAMLWrapper";
import type IActive from "../../data/active";
import type { MyContext } from "../../types/context";

export function removeAnonimousActive(ctx: MyContext, active: YAMLWrapper<IActive>) {
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
