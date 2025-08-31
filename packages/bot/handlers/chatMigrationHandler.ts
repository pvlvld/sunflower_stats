import { Filter, GrammyError } from "grammy";
import { Database } from "../db/db.js";
import { IContext } from "../types/context.js";
import { active } from "../redis/active.js";

class ChatMigrationHandler {
    private async handle(from_id: string, to_id: string): Promise<void> {
        console.info(`Chat migration ${from_id} -> ${to_id}`);
        let isErrorMigrating = false;

        const prepareChatQuery = `
            INSERT INTO public.chats (
                chat_id,
                is_premium,
                stats_bot_in,
                charts,
                statsadminsonly,
                usechatbgforall,
                selfdestructstats,
                line_color,
                font_color,
                userstatslink,
                title,
                locale
            )
            SELECT
                ${to_id} AS chat_id,
                is_premium,
                stats_bot_in,
                charts,
                statsadminsonly,
                usechatbgforall,
                selfdestructstats,
                line_color,
                font_color,
                userstatslink,
                title,
                locale
            FROM
                public.chats
            WHERE
                chat_id = ${from_id}
            ON CONFLICT (chat_id) DO UPDATE SET
                is_premium = EXCLUDED.is_premium,
                stats_bot_in = EXCLUDED.stats_bot_in,
                charts = EXCLUDED.charts,
                statsadminsonly = EXCLUDED.statsadminsonly,
                usechatbgforall = EXCLUDED.usechatbgforall,
                selfdestructstats = EXCLUDED.selfdestructstats,
                line_color = EXCLUDED.line_color,
                font_color = EXCLUDED.font_color,
                userstatslink = EXCLUDED.userstatslink,
                title = EXCLUDED.title,
                locale = EXCLUDED.locale;
            `;

        const moveStatsQuery = `
            INSERT INTO public.stats_daily (chat_id, user_id, count, date)
            SELECT
                ${to_id} AS chat_id,
                user_id,
                count,
                date
            FROM
                public.stats_daily
            WHERE
                chat_id = ${from_id}
            ON CONFLICT (chat_id, user_id, date)
            DO UPDATE SET count = stats_daily.count + EXCLUDED.count;
        `;

        await Database.poolManager.getPool.query(prepareChatQuery).catch((e) => {
            console.error("ChatMigrationHandler: Error preparing:", e);
        });
        await Database.poolManager.getPool.query(moveStatsQuery).catch((e) => {
            isErrorMigrating = true;
            console.error("ChatMigrationHandler: Error moving stats:", e);
        });
        active.migrateChatId(Number(from_id), Number(to_id));

        if (!isErrorMigrating) {
            // await Database.poolManager.getPool
            //     .query(
            //         `
            //     DELETE FROM public.chats
            //     WHERE chat_id = ${from_id};
            // `
            //     )
            //     .catch((e) => {
            //         console.error("ChatMigrationHandler: Error deleting old chat:", e);
            //     });
        }
    }

    async handleFromError(e: GrammyError): Promise<void> {
        if (!e.parameters.migrate_to_chat_id || !e.payload.chat_id) return;
        await this.handle(String(e.payload.chat_id), String(e.parameters.migrate_to_chat_id));
    }

    async handleFromCtx(ctx: Filter<IContext, "message:migrate_from_chat_id">): Promise<void> {
        await this.handle(
            String(ctx.msg.migrate_from_chat_id),
            String(ctx.msg.migrate_to_chat_id || ctx.chat.id),
        );
    }
}

const chatMigrationHandler = new ChatMigrationHandler();

export { chatMigrationHandler };
