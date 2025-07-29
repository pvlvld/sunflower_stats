import { blacklist } from "../../middlewares/blacklist.js";
import { IGroupTextContext } from "../../types/context.js";

async function addToBlacklist(ctx: IGroupTextContext) {
    const id = Number((ctx.msg.text ?? ctx.msg.caption).split(" ")[1]);
    if (isNaN(id)) return void (await ctx.reply("Invalid ID").catch((e) => {}));

    if (id < 0) {
        blacklist.banChat(id);
    } else {
        blacklist.banUser(id);
    }

    await ctx.reply(`Added ${id} to blacklist`).catch((e) => {});
}

export { addToBlacklist };
