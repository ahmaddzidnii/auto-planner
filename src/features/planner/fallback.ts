import type {
    EstimateOutput,
    PlannerInput,
    SprintOutput,
    SubtaskEstimate,
} from "@/features/planner/types";

const COMPLEXITY_FACTOR = 1.4;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function complexityBaseHours(complexity: number): number {
    return Math.round(complexity * COMPLEXITY_FACTOR + 2);
}

function riskByComplexity(complexity: number): "low" | "medium" | "high" {
    if (complexity <= 3) {
        return "low";
    }
    if (complexity <= 7) {
        return "medium";
    }
    return "high";
}

function levelMultiplier(level: PlannerInput["developer_level"]): number {
    if (level === "senior") {
        return 0.85;
    }
    if (level === "junior") {
        return 1.25;
    }
    return 1;
}

function priorityMultiplier(priority: PlannerInput["priority"]): number {
    if (priority === "high") {
        return 1.1;
    }
    if (priority === "low") {
        return 0.95;
    }
    return 1;
}

function makeBaseBreakdown(taskName: string): string[] {
    const lower = taskName.toLowerCase();

    if (lower.includes("jwt") || lower.includes("auth")) {
        return [
            "Setup auth strategy and token config",
            "Implement auth middleware/guard",
            "Build refresh token mechanism",
            "Add integration and edge-case tests",
        ];
    }

    if (lower.includes("payment") || lower.includes("checkout")) {
        return [
            "Integrate payment provider SDK",
            "Implement secure webhook/callback handler",
            "Handle failure/retry scenarios",
            "Add transaction testing",
        ];
    }

    return [
        "Requirement and technical analysis",
        "Core implementation",
        "Validation and error handling",
        "Testing and documentation",
    ];
}

export function generateLocalBreakdown(input: PlannerInput): SubtaskEstimate[] {
    const labels = makeBaseBreakdown(input.task_name);
    const totalHours = clamp(
        Math.round(complexityBaseHours(input.complexity) * levelMultiplier(input.developer_level)),
        3,
        80,
    );

    const distribution = [0.2, 0.4, 0.2, 0.2];
    const rawDurations = labels.map((_, index) => Math.max(1, Math.round(totalHours * distribution[index])));
    const delta = totalHours - rawDurations.reduce((sum, value) => sum + value, 0);
    rawDurations[1] += delta;

    const defaultRisk = riskByComplexity(input.complexity);

    return labels.map((name, index) => ({
        name,
        duration_hours: Math.max(1, rawDurations[index]),
        risk:
            index === 1 && defaultRisk !== "low"
                ? "high"
                : index === 0 && defaultRisk === "high"
                    ? "medium"
                    : defaultRisk,
    }));
}

export function generateLocalEstimate(input: PlannerInput): EstimateOutput {
    const breakdown = generateLocalBreakdown(input);
    const totalHours = clamp(
        Math.round(
            breakdown.reduce((sum, task) => sum + task.duration_hours, 0) * priorityMultiplier(input.priority),
        ),
        1,
        120,
    );

    return {
        estimated_hours: totalHours,
        risk: riskByComplexity(input.complexity),
        breakdown,
        rationale:
            "Fallback estimator aktif karena layanan AI tidak tersedia. Estimasi dihitung dari kompleksitas, priority, dan developer level secara deterministic.",
    };
}

export function generateLocalSprintPlan(
    tasks: SubtaskEstimate[],
    teamCapacityHours: number,
): SprintOutput {
    const sorted = [...tasks].sort((a, b) => {
        const riskWeight = { low: 1, medium: 2, high: 3 };
        const scoreA = a.duration_hours - riskWeight[a.risk] * 0.6;
        const scoreB = b.duration_hours - riskWeight[b.risk] * 0.6;
        return scoreA - scoreB;
    });

    const picked: Array<{ name: string; duration_hours: number }> = [];
    let total = 0;

    for (const task of sorted) {
        if (total + task.duration_hours <= teamCapacityHours) {
            picked.push({ name: task.name, duration_hours: task.duration_hours });
            total += task.duration_hours;
        }
    }

    return {
        recommended_tasks: picked,
        total_hours: total,
        remaining_hours: Math.max(0, teamCapacityHours - total),
        rationale:
            "Fallback sprint planner aktif: task dipilih berdasarkan kombinasi durasi dan risiko agar kapasitas sprint tetap aman.",
    };
}
