import YAMLStats from "../data/stats";

function addTodayUserMessages(
  chat_id: number,
  user_id: number,
  messages: number,
  yamlStats: YAMLStats
) {
  if (yamlStats.data[chat_id]?.[user_id]) {
    //@ts-ignore
    return messages + yamlStats.data[chat_id][user_id].messages;
  }
  return messages;
}

export default addTodayUserMessages;
