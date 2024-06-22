import type { IContext } from "../types/context";

async function hello(ctx: IContext) {
  return void (await ctx
    .reply(
      `
Привіт! Я неймовірно радий, що ви додали мене до свого чату ❤️
Аби ми краще познайомились, я хочу розказати вам трішки про свою сім'ю.

<a href="https://soniashnyk_bot.t.me">Соняшник</a>
Він найстарший та має найбільше функцій: РП, стосунки, адміністрування, рандом та навіть гру в Крокодила!

<a href="https://soniashnyk_statistics_bot.t.me">Соняшник | Статистика</a>
Збирає статистику, малює її графіки з вашим особистим фоном, а також дуже допомагає в автоматизації чистки!

<a href="https://soniashnyk_call_bot.t.me">Соняшник | Заклик</a>
Швидко збере всіх учасників чату`,
      {
        disable_notification: true,
        link_preview_options: { is_disabled: true },
        reply_parameters: {
          allow_sending_without_reply: true,
          message_id: ctx.msg?.message_id ?? -1,
        },
      }
    )
    .catch((e) => {}));
}

export { hello };
