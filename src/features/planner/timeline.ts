import type {
  SprintPlanningOutput,
  SubtaskEstimate,
  TimelineTask,
} from "@/features/planner/types";

const HOURS_PER_DAY = 8;

function toClassToken(value: string): string {
  return value.replace(/\s+/g, "-");
}

function toDate(value: string | Date): Date {
  const parsed =
    value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isHoliday(date: Date, holidaySet: Set<string>): boolean {
  return holidaySet.has(formatDate(date));
}

function advanceToWorkingDay(
  date: Date,
  includeWeekends: boolean,
  holidaySet: Set<string>,
): Date {
  const cursor = new Date(date);

  while (
    (!includeWeekends && isWeekend(cursor)) ||
    isHoliday(cursor, holidaySet)
  ) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);
  }

  return cursor;
}

function addWorkingDays(
  startDate: Date,
  workingDays: number,
  includeWeekends: boolean,
  holidaySet: Set<string>,
): Date {
  const cursor = new Date(startDate);
  let remainingDays = Math.max(1, workingDays);

  while (remainingDays > 0) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);

    if (
      (!includeWeekends && isWeekend(cursor)) ||
      isHoliday(cursor, holidaySet)
    ) {
      continue;
    }

    remainingDays -= 1;
  }

  return cursor;
}

function topologicalOrder(
  tasks: SprintPlanningOutput["tasks"],
): SprintPlanningOutput["tasks"] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: SprintPlanningOutput["tasks"] = [];

  function visit(taskId: string) {
    if (visited.has(taskId) || visiting.has(taskId)) {
      return;
    }

    const task = byId.get(taskId);
    if (!task) {
      return;
    }

    visiting.add(taskId);
    for (const dependencyId of task.dependencies) {
      visit(dependencyId);
    }
    visiting.delete(taskId);
    visited.add(taskId);
    ordered.push(task);
  }

  for (const task of tasks) {
    visit(task.id);
  }

  return ordered;
}

export function buildSprintTimeline(
  tasks: SprintPlanningOutput["tasks"],
  options: {
    sprintStartDate: string | Date;
    teamCapacityHours: number;
    sprintDurationWeeks: number;
    includeWeekends: boolean;
    holidayDates: string[];
  },
): TimelineTask[] {
  if (tasks.length === 0) {
    return [];
  }

  const holidaySet = new Set(options.holidayDates);
  const orderedTasks = topologicalOrder(tasks);
  const sprintStart = advanceToWorkingDay(
    toDate(options.sprintStartDate),
    options.includeWeekends,
    holidaySet,
  );
  const sprintWorkingDays = Math.max(
    1,
    options.sprintDurationWeeks * (options.includeWeekends ? 7 : 5),
  );
  const hoursPerWorkingDay = Math.max(
    1,
    options.teamCapacityHours / sprintWorkingDays,
  );

  const timeline: TimelineTask[] = [];
  const endById = new Map<string, Date>();
  let cursor = new Date(sprintStart);

  for (const task of orderedTasks) {
    const dependencyEnds = task.dependencies
      .map((dependencyId) => endById.get(dependencyId))
      .filter((value): value is Date => Boolean(value));

    const dependencyAnchor =
      dependencyEnds.length > 0
        ? new Date(Math.max(...dependencyEnds.map((value) => value.getTime())))
        : sprintStart;
    const startCandidate = new Date(
      Math.max(cursor.getTime(), dependencyAnchor.getTime()),
    );
    const startDate = advanceToWorkingDay(
      startCandidate,
      options.includeWeekends,
      holidaySet,
    );
    const durationDays = Math.max(
      1,
      Math.ceil(task.estimated_hours / hoursPerWorkingDay),
    );
    const endDate = addWorkingDays(
      startDate,
      durationDays,
      options.includeWeekends,
      holidaySet,
    );

    timeline.push({
      id: task.id,
      name: task.name,
      start: startDate,
      end: endDate,
      progress: 0,
      dependencies:
        task.dependencies.length > 0 ? task.dependencies.join(",") : undefined,
      custom_class: toClassToken(
        `complexity-${task.complexity}_priority-${task.priority}`,
      ),
    });

    endById.set(task.id, endDate);
    cursor = new Date(endDate);
  }

  return timeline;
}

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
      custom_class: toClassToken(`risk-${task.risk}`),
    };
  });
}
