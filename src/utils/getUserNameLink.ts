import Escape from "./escape";

const getUserNameLink = {
  markdown: (
    name: string,
    username: string | undefined,
    user_id: number | string
  ) => {
    return `[${Escape.markdownV1(name)}](${
      username && username !== "null"
        ? `https://${username}.t.me`
        : `tg://user?id=${user_id}`
    })`;
  },
  html: () => {},
};

export default getUserNameLink;
