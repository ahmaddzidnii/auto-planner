import type {
  SprintPlanningInput,
  SprintResource,
  SprintTaskInput,
} from "@/features/planner/types";


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
  return `You are a professional Sprint Planner. Analyze ${input.tasks.length} tasks for accurate sprint planning.


MAIN TASKS:
1. Determine complexity, minimum level, skill requirement, and estimated hours for each task
2. Identify task dependencies clearly and logically
3. Ensure resource allocation aligns with team capacity
4. Provide technical justification for each decision

IMPORTANT RULES:
- Estimate hours realistically based on complexity and skill level 
- Frontend (React/UI/Component) and Backend (API/Database/Auth) for the same feature = PARALLEL (no dependency)
- Testing/Integration tasks MUST depend on UI + API completion
- Dependencies only to existing task IDs (don't add/remove tasks)
- If a task depends on another, explain it with detail
- Minimum level ≤ maximum team level available
- Skill mapping: 
  * backend: API, Database, Authentication, Server Logic
  * frontend: React/UI, Styling, Client Logic
  * fullstack: Combination of Backend + Frontend
  * devops: Infrastructure, Deployment, CI/CD
  * qa: Testing, Bug Verification
  * analist: Documentation, Requirements, Planning

SPRINT INFORMATION:
- Sprint Name: ${input.sprint_name}
- Start Date: ${input.sprint_start_date}
- Duration: ${input.sprint_duration_weeks} weeks (${input.sprint_duration_weeks * (input.include_weekends ? 7 : 6)} working days)
- Team Resources: ${summarizeResources(input.resources)}
- Include Weekends: ${input.include_weekends ? 'yes' : 'no'}
- Holiday Dates: ${input.holiday_dates.length > 0 ? input.holiday_dates.join(', ') : 'none'}

TASK LIST:
${summarizeTasks(input.tasks)}

COMPLEXITY CRITERIA:
- low: Simple task, straightforward, familiar
- medium: Moderate task, some uncertainty
- high: Complex task, high uncertainty

LANGUAGE & FORMAT REQUIREMENTS:
1. ALL string values MUST BE IN INDONESIAN LANGUAGE (sprint_name, resource_summary, sprint_rationale, and all task rationale)
2. Field names stay in English
3. Strictly follow character limits:
   - sprint_name: 3-120 characters
   - resource_summary: 2 sentences max in Indonesian
   - sprint_rationale: 2 sentences max in Indonesian
   - task.rationale: 2 sentences max in Indonesian
   - estimated_hours: integer, no decimals
4. Only use these exact skill values: backend, frontend, fullstack, devops, qa, analist

RETURN JSON ONLY with this exact structure:
{
  "sprint_name": string (3-120 chars, Indonesian),
  "sprint_start_date": "YYYY-MM-DD",
  "sprint_duration_weeks": number,
  "total_resource_capacity_hours": number (total team available hours for sprint),
  "total_estimated_hours": number (sum of all task estimated_hours),
  "remaining_capacity_hours": number (= total_resource_capacity_hours - total_estimated_hours),
  "fit_status": "fit" or "tight" or "over",
  "resource_summary": string (2 sentences max, Indonesian, describe team composition and capacity),
  "sprint_rationale": string (2 sentences max, Indonesian, explain sprint planning strategy),
  "tasks": [
    {
      "id": string (original task id),
      "name": string (original task name),
      "description": string (original task description),
      "priority": "low" or "medium" or "high",
      "complexity": "low" or "medium" or "high",
      "minimum_level": "junior" or "mid" or "senior",
      "minimum_skill": "backend" or "frontend" or "fullstack" or "devops" or "qa" or "analist",
      "estimated_hours": number,
      "dependencies": [array of task IDs],
      "rationale": string (2 sentences max, Indonesian, concise technical explanation of estimation and dependencies)
    }
  ]
}

CRITICAL CONSTRAINTS:
- Return ONLY valid JSON, no markdown
- No adding or removing tasks
- All rationale strings must be concise and in Indonesian
- Do not exceed character limits
- Ensure total_resource_capacity_hours matches team resources and sprint duration`;
}
