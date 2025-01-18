import { IContext } from "../types/context.js";
import start_menu from "../ui/menus/start.js";

function start_cmd(ctx: IContext) {
    ctx.replyWithPhoto("AgACAgIAAx0Cf9MvPQABAbrmZ4vE9d5ytVv4VxcEGhHjVd4XLJ0AAnrtMRsYGGBISBtqUoD-kZ0BAAMCAAN5AAM2BA", {
        caption: `
🌻 Бот Соняшник | Статистика – найзручніший спосіб слідкувати за активністю вашого чату!

🔍 Що вміє бот?

📊 Відображає статистику за день, тиждень, місяць або будь-який період.
🎨 Генерує унікальні графіки статистики з власними фонами та кольорами.
🧹 Інструменти для управління активністю учасників: чистка неактивних, приховування користувачів зі статистики.
⚙️ Можливість обмежити виклики статистики, вимкнути посилання на акаунти, тощо.
🌟 Унікальна функція: персоналізуйте фон графіків для себе та чату власними зображеннями!

Додавайте бота, досліджуйте активність та зробіть ваш чат ще цікавішим! 💬
👉 Дізнайтесь більше: soniashnyk.t.me`,
        disable_notification: true,
        reply_markup: start_menu,
        reply_parameters: {
            allow_sending_without_reply: true,
            message_id: ctx.msg?.message_id ?? -1,
        },
    }).catch(console.error);
}

export { start_cmd };
