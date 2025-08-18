import moment from "moment";
import { getOldDbPool } from "../../db/oldDb.js";
import { IGroupHearsCommandContext } from "../../types/context.js";
import formattedDate from "../../utils/date.js";
import cacheManager from "../../cache/cache.js";
import cfg from "../../config.js";

type IUsers_son = {
    user_id: number;
    date_ended_premium: Date | null;
    status_premium: 1 | 0;
};

async function setPremium_command(ctx: IGroupHearsCommandContext) {
    if (!ctx.from || !cfg.ADMINS.includes(ctx.from.id)) {
        return;
    }

    const args = (ctx.msg.text ?? ctx.msg.caption).split(" ");
    args.shift();

    if (args.length < 2 && args[1] === "1") {
        return void ctx.reply("usage: /prem &lt;user_id&gt; 1 &lt;date?&gt;");
    }
    if ((args.length < 2 && args[1] === "0") || !["0", "1"].includes(args[1])) {
        console.log(args);
        return void ctx.reply("usage: /prem &lt;user_id&gt; &lt;status&gt; &lt;date?&gt;");
    }
    if (!parseInt(args[0])) {
        return void ctx.reply("Invalid user ID.");
    }
    if (args[1] === "1" && args[2] && !/^\d{4}-\d{2}-\d{2}$/.test(args[2])) {
        return void ctx.reply("Invalid date format. Use YYYY-MM-DD.");
    }

    const db = await getOldDbPool();

    const info_query = "SELECT * FROM users_son WHERE user_id = ?;";
    //@ts-expect-error
    const info = (await db.query<IUsers_son[]>(info_query, [args[0]]))[0];

    if (info && info[0]) {
        const currentDate = info[0].date_ended_premium;
        const targetDate = args[2]
            ? moment(new Date(args[2])).format("YYYY-MM-DD")
            : moment().add(1, "month").format("YYYY-MM-DD");
        let newDate: string = "";

        if (currentDate && moment(currentDate).isAfter(moment())) {
            // Calculate the difference between today and targetDate, add to today
            const diffDays = moment(targetDate).diff(moment(), "days");
            newDate = moment().add(diffDays, "days").format("YYYY-MM-DD");

            if (args[1] === "1" && info[0].status_premium === 1) {
                ctx.reply(
                    `User ${args[0]} is already premium. New date: ${newDate}. Use /prem ${args[0]} 0 to remove premium.`
                ).catch((e) => {});
            }
        } else {
            newDate = targetDate;
        }

        const update_query = "UPDATE users_son SET status_premium = ?, date_ended_premium = ? WHERE user_id = ?;";
        cacheManager.PremiumStatusCache.set(+args[0], true);
        await db.query(update_query, [args[1], args[1] === "1" ? newDate : null, args[0]]);
    } else {
        if (args[1] === "0") {
            return void ctx.reply(`User ${args[0]} is not premium.`);
        }

        const targetDate = args[2]
            ? moment(new Date(args[2])).format("YYYY-MM-DD")
            : moment().add(1, "month").format("YYYY-MM-DD");

        const insert_query = "INSERT INTO users_son (user_id, status_premium, date_ended_premium) VALUES (?, ?, ?);";
        cacheManager.PremiumStatusCache.set(+args[0], true);
        await db.query(insert_query, [args[0], args[1], args[1] === "1" ? targetDate : null]);
    }

    return void (await ctx.react("💅").catch((e) => {}));
}

export { setPremium_command };
