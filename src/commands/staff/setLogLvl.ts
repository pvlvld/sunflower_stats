import cfg from "../../config.js";
import { IGroupHearsContext } from "../../types/context.js";

const errMsg = "Рівень логів має бути числом";
function setLogLvl(ctx: IGroupHearsContext) {
    if (!cfg.ADMINS.includes(ctx.from.id)) {
        return;
    }
    const lvl = Number((ctx.msg.caption ?? ctx.msg.text).split(" ")[1]);
    if (!isNaN(lvl)) {
        cfg.LOG_LVL.set(lvl);
    } else {
        console.error(errMsg);
        ctx.reply(errMsg).catch((e) => {});
    }
}

export { setLogLvl };
