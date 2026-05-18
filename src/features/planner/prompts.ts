import type {
  PlannerInput,
  SprintPlanningInput,
  SprintResource,
  SprintTaskInput,
  SubtaskEstimate,
} from "@/features/planner/types";

const KNOWLEDGE_SNIPPETS = [
  {
    keywords: ["jwt", "auth"],
    notes: ["Auth lib + token strategy", "Protected routes/middleware", "Refresh token flow"],
  },
  {
    keywords: ["payment", "gateway"],
    notes: ["Payment SDK + webhook validation", "Retry/failure handling"],
  },
  {
    keywords: ["crud", "dashboard"],
    notes: ["Data model + validation", "CRUD endpoints", "Tests"],
  },
];

function injectKnowledge(taskName: string, description?: string): string {
  const source = `${taskName} ${description ?? ""}`.toLowerCase();
  const matched = KNOWLEDGE_SNIPPETS.filter((item) =>
    item.keywords.some((keyword) => source.includes(keyword)),
  );

  if (matched.length === 0) {
    return "Gunakan best practice umum software engineering: analysis, implementation, testing, documentation.";
  }

  return matched
    .flatMap((item) => item.notes)
    .map((note) => `- ${note}`)
    .join("\n");
}

export function buildEstimatePrompt(input: PlannerInput): string {
  return `AI project estimator. For task: "${input.task_name}" (${input.description || 'no description'})

Estimate realistic hours, risk (low|medium|high), and 3-8 subtasks.
Complexity: ${input.complexity}/10, Priority: ${input.priority}, Dev: ${input.developer_level}

Knowledge: ${injectKnowledge(input.task_name, input.description)}

Return JSON only:
{
  "estimated_hours": number,
  "risk": "low"|"medium"|"high",
  "breakdown": [{"name": string, "duration_hours": number, "risk": "low"|"medium"|"high"}],
  "rationale": string
}`;
}

export function buildBreakdownPrompt(input: PlannerInput): string {
  return `Kamu adalah AI software project manager.
Bagi task software menjadi subtasks teknis terurut.

Aturan:
- Hanya kembalikan JSON valid.
- Setiap subtask wajib punya nama, estimasi durasi jam, dan level risiko.
- Buat 3 sampai 8 subtask.

Knowledge Injection:
${injectKnowledge(input.task_name, input.description)}

Input:
${JSON.stringify(input, null, 2)}

Output JSON wajib:
{
  "breakdown": [
    {Break down task "${input.task_name}" into 3-8 subtasks. Complexity: ${input.complexity}/10, Dev: ${input.developer_level}

Knowledge: ${injectKnowledge(input.task_name, input.description)}

Return JSON only:
{
  "breakdown": [{"name": string, "duration_hours": number, "risk": "low"|"medium"|"high"}JSON.stringify(
    {
      sprint_days: sprintDays,
      team_capacity_hours: teamCapacityHours,
      tasks,
    },
    null,
    2,
  )}

Output JSON wajib:
{
  "recommended_tasks": [
    {
      "name": string,
      "duration_hours": number
    }
  ],
  "total_hours": number,
  "remaining_hours": number,
  "rationale": string
}`;
}

function resourceCapacityHint(resource: SprintResource): number {
  const levelMultiplier =
    resource.level === "senior" ? 1.1 : resource.level === "junior" ? 0.85 : 1;
  const skillMultiplier =
    resource.skill === "fullstack"
      ? 1.05
      : resource.skill === "devops"
        ? 0.95
        : resource.skill === "qa"
          ? 0.9
          : resource.skill === "analist"
            ? 0.85
            : 1;

  return Math.round(resource.quantity * 40 * levelMultiplier * skillMultiplier);
}

function summarizeResources(resources: SprintResource[]): string {
  return resources
    .map(
      (resource) =>
        `${resource.quantity} ${resource.level} ${resource.skill} (${resourceCapacityHint(resource)} jam)`,
    )
    .join(", ");
}

function summarizeTasks(tasks: SprintTaskInput[]): string {
  return tasks
    .map(
      (task, index) =>
        `${index + 1}. [${task.id}] ${task.name} | priority=${task.priority} | desc=${task.description}`,
    )
    .join("\n");
}

export function buildSprintPlanningPrompt(input: SprintPlanningInput): string {
  return `Sprint analyst. Analyze ${input.tasks.length} tasks, set complexity/level/skill/hours, find dependencies.

Rules:
- Frontend (React/UI) vs Backend (API/DB/Auth) skill mapping
- Min level ≤ max team level  
- Frontend & Backend for same feature = parallel, no dependency
- Testing/Integration must depend on UI+API
- Keep all ${input.tasks.length} tasks, no add/remove
- JSON only, no markdown

Sprint: ${input.sprint_name} | ${input.sprint_start_date} | ${input.sprint_duration_weeks}w | Resources: ${summarizeResources(input.resources)}
Weekends: ${input.include_weekends ? 'yes' : 'no'} | Holidays: ${input.holiday_dates.length > 0 ? input.holiday_dates.join(', ') : 'none'}

Tasks:
${summarizeTasks(input.tasks)}

Return:
{
  "sprint_name": string,
  "sprint_start_date": "YYYY-MM-DD",
  "sprint_duration_weeks": number,
  "total_resource_capacity_hours": number,
  "total_estimated_hours": number,
  "remaining_capacity_hours": number,
  "fit_status": "fit"|"tight"|"over",
  "resource_summary": string,
  "sprint_rationale": string,
  "tasks": [{"id": string, "name": string, "description": string, "priority": "low"|"medium"|"high", "complexity": "low"|"medium"|"high", "minimum_level": "junior"|"mid"|"senior", "minimum_skill": "backend"|"frontend"|"analist"|"devops"|"qa"|"fullstack", "estimated_hours": number, "dependencies": [string], "rationale": string}]
}`;
}
