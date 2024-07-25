import { IGroupHearsContext } from "../types/context.js";
import { IMedia, IMediaMethodType, MediaTypes } from "./sendMediaMessage.js";

function getMessageMedia(ctx: IGroupHearsContext): IMedia {
  for (const type of MediaTypes) {
    if (type in ctx.msg) {
      if (Array.isArray(ctx.msg[type])) {
        return { file_id: ctx.msg[type][0].file_id, type: toTitleCase(type) };
      }
      if (typeof ctx.msg[type] === "object") {
        return { file_id: ctx.msg[type].file_id, type: toTitleCase(type) };
      }
    }
  }
  return { file_id: "", type: "Without" };
}

function toTitleCase(type: (typeof MediaTypes)[number]) {
  return (type[0].toUpperCase() + type.slice(1)) as IMediaMethodType;
}

export { getMessageMedia };
