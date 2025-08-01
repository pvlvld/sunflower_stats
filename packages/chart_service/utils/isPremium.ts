import type { IChartTask } from "@sunflower-stats/shared";

export function isPremium(task: IChartTask, target_id: number): boolean {
    return target_id > 0 ? task.user_premium : task.chat_premium;
}
