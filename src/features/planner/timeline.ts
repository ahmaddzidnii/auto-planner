import type { SubtaskEstimate, TimelineTask } from "@/features/planner/types";

const HOURS_PER_DAY = 8;

export function buildSequentialTimeline(
    subtasks: SubtaskEstimate[],
    startDate: Date = new Date(),
): TimelineTask[] {
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    let cursor = new Date(normalizedStart);

    return subtasks.map((task, index) => {
        const daySpan = Math.max(1, Math.ceil(task.duration_hours / HOURS_PER_DAY));
        const taskStart = new Date(cursor);
        const taskEnd = new Date(cursor);
        taskEnd.setDate(taskEnd.getDate() + daySpan);

        cursor = new Date(taskEnd);

        return {
            id: String(index + 1),
            name: task.name,
            start: taskStart,
            end: taskEnd,
            progress: 0,
            dependencies: index > 0 ? String(index) : undefined,
            custom_class: `risk-${task.risk}`,
        };
    });
}
