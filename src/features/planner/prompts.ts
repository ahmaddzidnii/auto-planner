import type { PlannerInput, SubtaskEstimate } from "@/features/planner/types";

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
