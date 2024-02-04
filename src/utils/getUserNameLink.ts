import escapeMarkdownV2 from "./escapeMarkdownV2";

const getUserNameLink = {
  markdown: (name: string, username: string | undefined, user_id: number) => {
    return `[${escapeMarkdownV2(name)}](${
      username && username !== "null"
        ? `https://${username}.t.me`
        : `tg://user?id=${user_id}`
    })`;
  },
  html: () => {},
};

export default getUserNameLink;
