import { MyContext } from "../types/context";
import help_menu from "../ui/menus/help";

async function help_cmd(ctx: MyContext) {
  await ctx.reply(
    `
Привіт! Я — новий бот для статистики із сім'ї Соняшника. Ось мої команди: 
📊 Стата/статистика вчора/день/тиждень/місяць/рік/вся
!я — власний актив
!ти — чужий актив
!інактив X — замість x номер сторінки
+нік Х, +нікнейм Х — замість x бажаний нікнейм. Відображається замість імені у всіх командах\nМожна видалити -нік
/sshide - у відповідь на повідомлення, з іменем (/sshide vld) чи юзернеймом (/sshide @vld), щоб прибрати зі статистики людину, котрої немає в чаті 
Бот? — просто команда, на яку я маю зреагувати. Якщо цього не відбувається, то, скоріш за все, я пішов спати 😴
`,
    {
      disable_notification: true,
      reply_markup: help_menu,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default help_cmd;
