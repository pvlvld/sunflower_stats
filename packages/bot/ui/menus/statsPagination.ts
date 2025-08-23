import type { IContext, IGroupTextContext } from "../../types/context.js";
import type { IDateRange } from "../../commands/stats_chat.js";
import { Menu, MenuButton } from "@grammyjs/menu";
import { getCachedOrDBChatSettings } from "../../utils/chatSettingsUtils.js";
import { getStatsChatRating } from "../../utils/getStatsRating.js";
import { DBStats } from "../../db/stats.js";
import { MessageEntity } from "@grammyjs/types";
import { active } from "../../redis/active.js";
import { GrammyError } from "grammy";

const chatStatsPagination_menu = new Menu<IContext>("chatStatsPagination-menu").dynamic(async (ctx, range) => {
    if (
        !ctx.chat ||
        !ctx.from ||
        !ctx.msg ||
        !(ctx.msg.caption || ctx.msg.text) ||
        !["group", "supergroup"].includes(ctx.chat.type)
    ) {
        return;
    }

    const nextBtn: MenuButton<IContext> = {
        text: "↝",
        middleware: [
            async (ctx: IContext) => {
                changePage(ctx as IGroupTextContext, baseInfo, "next");
            },
        ],
    };
    const previousBtn: MenuButton<IContext> = {
        text: "↜",
        middleware: [
            async (ctx: IContext) => {
                changePage(ctx as IGroupTextContext, baseInfo, "previous");
            },
        ],
    };

    range.add(previousBtn).add(nextBtn);
    if (!isHasMetadata(ctx)) {
        return range;
    }

    const baseInfo = await getBaseInfo(ctx as IGroupTextContext);
    return range;
});

const chopMetadataPart = "http://t.me/meta?";

function isHasMetadata(ctx: IContext) {
    const meta_entity = (ctx.msg?.entities || ctx.msg?.caption_entities)?.at(-1);
    return meta_entity?.type === "text_link" && meta_entity.url.startsWith(chopMetadataPart);
}

function extractMetadata(ctx: IGroupTextContext) {
    const metadata_entity = (ctx.msg.caption_entities ?? ctx.msg.entities!).at(-1);
    return metadata_entity?.type === "text_link" ? parseMetadata(metadata_entity.url) : undefined;
}

function parseMetadata(raw_medatada_text: string) {
    let parts: string[] = [];
    // ?u=${getStatsUsersCount(chat_id, stats)}?l=${statsRowLimit}?r=${dateRange}?p=${page}
    return raw_medatada_text
        .slice(chopMetadataPart.length)
        .split("?")
        .reduce((prev, curr) => {
            parts = curr.split("=");
            prev[parts[0]] = parts[1];
            return prev;
        }, {} as Record<string, string>);
}

async function getBaseInfo(ctx: IGroupTextContext) {
    const chat_id = ctx.chat.id;
    const metadata = extractMetadata(ctx)!;
    const settings = await getCachedOrDBChatSettings(chat_id);
    const membersCount = +metadata.u;
    const pageSize = +metadata.l;
    const dateRange = metadata.r;
    const pagesCount = Math.ceil(membersCount / pageSize);
    const currentPage = +metadata.p;
    const pageOutOfPagesStr = `${currentPage}/${pagesCount}`;

    return { chat_id, settings, pagesCount, currentPage, pageOutOfPagesStr, dateRange };
}

async function changePage(
    ctx: IGroupTextContext,
    baseInfo: Awaited<ReturnType<typeof getBaseInfo>>,
    direction: "previous" | "next"
) {
    try {
        if (ctx.msg.caption) {
            await ctx.editMessageCaption({ caption: await getPage(baseInfo, direction) });
        } else {
            await ctx.editMessageText(await getPage(baseInfo, direction), {
                link_preview_options: { is_disabled: true },
            });
        }
    } catch (error) {
        if (error instanceof GrammyError) {
            if (
                error.description.startsWith("Bad Request: message is not modified") ||
                error.description.startsWith("Too Many Requests")
            ) {
                return;
            }
        }

        console.error("Error while changing page:", error);
    }
}

async function getPage(baseInfo: Awaited<ReturnType<typeof getBaseInfo>>, direction: "previous" | "next") {
    const [stats, activeUsers] = await Promise.all([
        DBStats.chat.inRage(baseInfo.chat_id, baseInfo.dateRange as IDateRange),
        active.getChatUsers(baseInfo.chat_id),
    ]);
    let target_page = 1;
    if (direction === "next") {
        if (baseInfo.currentPage + 1 > baseInfo.pagesCount) {
            target_page = 1;
        } else {
            target_page = baseInfo.currentPage + 1;
        }
    } else {
        if (baseInfo.currentPage - 1 === 0) {
            target_page = baseInfo.pagesCount;
        } else {
            target_page = baseInfo.currentPage - 1;
        }
    }

    const statsMsesage = await getStatsChatRating(
        baseInfo.chat_id,
        stats,
        activeUsers,
        baseInfo.settings,
        target_page,
        baseInfo.dateRange as IDateRange,
        "caption"
    );

    return statsMsesage;
}

export { chatStatsPagination_menu };
