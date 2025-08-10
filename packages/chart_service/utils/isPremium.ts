import type { IChartStatsTask } from "@sunflower-stats/shared";

export function isPremium(task: IChartStatsTask, target_id: number): boolean {
    return target_id > 0 ? task.user_premium : task.chat_premium;
}
