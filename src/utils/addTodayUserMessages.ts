import YAMLStats from "../data/stats";

function addTodayUserMessages(
  chat_id: number,
  user_id: number,
  messages: number,
  yamlStats: YAMLStats
) {
  return messages + (yamlStats.data[chat_id]?.[user_id] || 0);
}

export default addTodayUserMessages;
