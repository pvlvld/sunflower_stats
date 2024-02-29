import YAMLWrapper from "../../data/YAMLWrapper";
import IActive from "../../data/active";

export function removeAnonimousActive(active: YAMLWrapper<IActive>) {
  for (const chat_id in active.data) {
    for (const user_id in active.data[chat_id]) {
      if ([136817688, 777000].includes(+user_id)) {
        delete active.data[chat_id]?.[user_id];
      }
    }
  }
}
