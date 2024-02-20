import Escape from "./escape";

const getUserNameLink = {
  markdown: (
    name: string,
    username: string | undefined | null,
    user_id: number | string
  ) => {
    return `[${Escape.markdownV1(name)}](${
      username && username !== "null"
        ? `https://${username}.t.me`
        : `tg://user?id=${user_id}`
    })`;
  },
  html: (
    name: string,
    username: string | undefined | null,
    user_id: number | string
  ) => {
    return `<a href="${
      username && username !== "null"
        ? `https://${username}.t.me`
        : `tg://user?id=${user_id}`
    }">${Escape.html(name)}</a>`;
  },
};

export default getUserNameLink;
