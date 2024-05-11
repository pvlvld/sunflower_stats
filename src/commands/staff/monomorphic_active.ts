import { active } from "../../data/active";

function monomorphic_active() {
  let chat_id = "";
  let user_id = "";
  for (chat_id in active.data) {
    for (user_id in active.data[chat_id]) {
      active.data[chat_id]![user_id] = {
        active_first: active.data[chat_id]![user_id]!.active_first,
        active_last: active.data[chat_id]![user_id]!.active_last,
        name: active.data[chat_id]![user_id]!.name,
        nickname: active.data[chat_id]![user_id]!.nickname || null,
        username: active.data[chat_id]![user_id]!.username || null,
      };
    }
  }

  console.log("done");
}

export { monomorphic_active };
