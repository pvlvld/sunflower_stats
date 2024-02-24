import { MyContext } from "../types/context";
import YAMLWrapper from "../data/YAMLWrapper";
import IActive from "../data/active";

async function delete_from_stats(ctx: MyContext, active: YAMLWrapper<IActive>) {
    const chatMember = await ctx.getChatMember(ctx.from?.id || -1)
    if (!chatMember || chatMember.status != 'creator') {
        ctx.reply("❌ Щось пішло не так або ви не є власником чату");
        return
    } else {
        //@ts-expect-error
        if (active.data[ctx.chat.id]?.[ctx.message.reply_to_message.from.id]) {
            //@ts-expect-error
            const name = active.data[ctx.chat.id][ctx.message.reply_to_message.from.id].name
            //@ts-expect-error
            delete active.data[ctx.chat.id][ctx.message.reply_to_message.from.id]
            ctx.reply(`✅ Успішно видалено ${name} з активу та приховано зі статистики.`)
        } else {
            ctx.reply("❌ Цього користувача немає в активі.")
        }
    }

}

export default delete_from_stats;


