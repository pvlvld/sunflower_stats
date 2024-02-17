"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const help_1 = __importDefault(require("../ui/menus/help"));
function help_cmd(ctx) {
    ctx.reply(`
Привіт! Я — новий бот для статистики із сім'ї Соняшника. Ось мої команди: 
📊 Стата/статистика вчора/день/тиждень/місяць/вся
!я — власний актив
!ти — чужий актив
!неактив X — замість x потрібне число , неактив за вказаний період днів
+нік Х, +нікнейм Х — замість х бажаний нікнейм. Відображається замість імені у всіх командах

Бот? — просто команда, на яку я маю зреагувати. Якщо цього не відбувається, то, скоріш за все, я пішов спати 😴
`, { reply_markup: help_1.default });
}
exports.default = help_cmd;
