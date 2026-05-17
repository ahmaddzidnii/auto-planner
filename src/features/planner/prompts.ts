import type {
  PlannerInput,
  SprintPlanningInput,
  SprintResource,
  SprintTaskInput,
  SubtaskEstimate,
} from "@/features/planner/types";

const KNOWLEDGE_SNIPPETS = [
  {
    keywords: ["jwt", "authentication", "auth"],
    notes: [
      "Setup authentication library and token strategy",
      "Build middleware/guard for protected routes",
      "Implement refresh token flow",
      "Write integration tests for token expiry and invalid token",
    ],
  },
  {
    keywords: ["payment", "gateway", "checkout"],
    notes: [
      "Integrate payment provider SDK",
      "Create secure callback/webhook validation",
      "Handle retry and failure scenarios",
      "Test happy path and refund/cancel edge cases",
    ],
  },
  {
    keywords: ["crud", "user", "dashboard"],
    notes: [
      "Define data model and validation",
      "Build create/read/update/delete endpoints",
      "Connect UI form and table state",
      "Add role/permission checks and testing",
    ],
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
  return `Kamu adalah AI software project manager yang fokus pada estimasi task software.

Tugas:
1) Estimasi durasi realistis dalam jam.
2) Analisis risiko (low|medium|high).
3) Breakdown task menjadi subtask kecil.

Aturan:
- Gunakan kompleksitas (1-10), prioritas, dan level developer untuk mempengaruhi estimasi.
- Total durasi breakdown harus mendekati estimated_hours.
- Jangan beri output markdown, hanya JSON valid.

Knowledge Injection:
${injectKnowledge(input.task_name, input.description)}

Input:
${JSON.stringify(input, null, 2)}

Output JSON wajib mengikuti schema ini:
{
  "estimated_hours": number,
  "risk": "low" | "medium" | "high",
  "breakdown": [
    {
      "name": string,
      "duration_hours": number,
      "risk": "low" | "medium" | "high"
    }
  ],
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
    {
      "name": string,
      "duration_hours": number,
      "risk": "low" | "medium" | "high"
    }
  ]
}`;
}

export function buildSprintPrompt(
  tasks: SubtaskEstimate[],
  teamCapacityHours: number,
  sprintDays: number,
): string {
  return `Kamu adalah AI sprint planner untuk software team.

Tugas:
- Pilih task yang paling masuk akal untuk sprint.
- Total jam tidak boleh melebihi kapasitas tim.
- Prioritaskan urutan yang memberi nilai paling tinggi di sprint ini.

Input:
${JSON.stringify(
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
  return `Kamu adalah AI sprint analyst dan sprint planner untuk tim software.

Tujuan:
1) Analisis setiap task secara objektif berdasarkan deskripsi teknis.
2) Tentukan complexity (low, medium, high).
3) Tentukan minimum developer level dan skill minimum.
4) Estimasi jam pengerjaan per task.
5) Tentukan dependency antar-task hanya dari konteks task yang diberikan.
6) Cocokkan hasil analisis dengan kapasitas resource sprint.

Aturan analisis:
- Gunakan deskripsi secara teknis, bukan asumsi umum.
- Jika task menyebut framework, library, integrasi, auth, payment, migrasi data, atau deployment, naikkan complexity bila relevan.
- Jika task jelas frontend, backend, qa, devops, atau analisis bisnis, tentukan skill minimum yang paling tepat.
- Jika resource hanya fullstack solo, tetap analisis task seolah-olah task butuh level minimum dan skill minimum, tetapi kapasitas sprint harus dihitung dari resource fullstack tersebut.
- Dependency harus berupa array id task yang memang ada di input dan hanya task yang logis dikerjakan lebih dulu.
- Output harus JSON valid tanpa markdown atau komentar.

Sprint summary:
- Sprint name: ${input.sprint_name}
- Sprint start date: ${input.sprint_start_date}
- Sprint duration weeks: ${input.sprint_duration_weeks}
- Include weekends: ${input.include_weekends}
- Holiday dates: ${input.holiday_dates.length > 0 ? input.holiday_dates.join(", ") : "none"}
- Resources: ${summarizeResources(input.resources)}

Tasks:
${summarizeTasks(input.tasks)}

Estimated capacity hint:
${summarizeResources(input.resources)}

Output JSON wajib mengikuti format ini:
{
  "sprint_name": string,
  "sprint_start_date": "YYYY-MM-DD",
  "sprint_duration_weeks": number,
  "total_resource_capacity_hours": number,
  "total_estimated_hours": number,
  "remaining_capacity_hours": number,
  "fit_status": "fit" | "tight" | "over",
  "resource_summary": string,
  "sprint_rationale": string,
  "tasks": [
  {
    "id": string,
    "name": string,
    "description": string,
    "priority": "low" | "medium" | "high",
    "complexity": "low" | "medium" | "high",
    "minimum_level": "junior" | "mid" | "senior",
    "minimum_skill": "backend" | "frontend" | "analist" | "devops" | "qa" | "fullstack",
    "estimated_hours": number,
    "dependencies": [string],
    "rationale": string
  }
  ]
}`;
}
