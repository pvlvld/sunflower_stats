import { MyContext } from "../types/context";
import start_menu from "../ui/menus/start";

async function start_cmd(ctx: MyContext) {
  await ctx.reply(
    `
Привіт! Я — новий бот для статистики із сім'ї Соняшника. Ось мої команди: 
📊 Стата/статистика вчора/день/тиждень/місяць/рік/вся
!я — власний актив
!ти — чужий актив
!неактив X - замість x потрібне число , неактив за вказаний період днів
+нік Х, +нікнейм Х — замість х бажаний нікнейм. Відображається замість імені у всіх командах\nМожна видалити -нік

Бот? — просто команда, на яку я маю зреагувати. Якщо цього не відбувається, то, скоріш за все, я пішов спати 😴
`,
    {
      disable_notification: true,
      reply_markup: start_menu,
      link_preview_options: { is_disabled: true },
    }
  );
}

export default start_cmd;
