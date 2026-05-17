import type {
  EstimateOutput,
  PlannerInput,
  PriorityLevel,
  SprintPlanningInput,
  SprintPlanningOutput,
  SprintResource,
  SprintTaskInput,
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
    Math.round(
      complexityBaseHours(input.complexity) *
        levelMultiplier(input.developer_level),
    ),
    3,
    80,
  );

  const distribution = [0.2, 0.4, 0.2, 0.2];
  const rawDurations = labels.map((_, index) =>
    Math.max(1, Math.round(totalHours * distribution[index])),
  );
  const delta =
    totalHours - rawDurations.reduce((sum, value) => sum + value, 0);
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
      breakdown.reduce((sum, task) => sum + task.duration_hours, 0) *
        priorityMultiplier(input.priority),
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

function normalizeSource(task: SprintTaskInput): string {
  return `${task.name} ${task.description}`.toLowerCase();
}

function detectTaskFamily(source: string): {
  complexity: "low" | "medium" | "high";
  minimum_level: PlannerInput["developer_level"];
  minimum_skill: SprintPlanningOutput["tasks"][number]["minimum_skill"];
  baseHours: number;
  rationale: string;
} {
  if (
    /payment|checkout|billing|invoice|subscription|gateway|transaction/.test(
      source,
    )
  ) {
    return {
      complexity: "high",
      minimum_level: "senior",
      minimum_skill: "backend",
      baseHours: 28,
      rationale:
        "Task melibatkan payment atau transaksi sensitif sehingga butuh backend senior.",
    };
  }

  if (
    /auth|authentication|authorization|jwt|role|permission|security|oauth|login/.test(
      source,
    )
  ) {
    return {
      complexity: "high",
      minimum_level: "senior",
      minimum_skill: "backend",
      baseHours: 24,
      rationale:
        "Task berkaitan dengan auth/security dan biasanya memerlukan penanganan backend yang hati-hati.",
    };
  }

  if (
    /deploy|deployment|docker|kubernetes|ci\/cd|pipeline|infra|devops|monitoring/.test(
      source,
    )
  ) {
    return {
      complexity: "high",
      minimum_level: "mid",
      minimum_skill: "devops",
      baseHours: 20,
      rationale:
        "Task mengarah ke deployment/infrastruktur sehingga skill DevOps menjadi minimum yang paling logis.",
    };
  }

  if (/test|testing|unit test|integration test|e2e|qa|quality/.test(source)) {
    return {
      complexity: "medium",
      minimum_level: "junior",
      minimum_skill: "qa",
      baseHours: 12,
      rationale:
        "Task fokus ke testing/quality assurance sehingga skill QA adalah minimum yang paling sesuai.",
    };
  }

  if (
    /frontend|ui|ux|form|table|dashboard|page|component|css|responsive/.test(
      source,
    )
  ) {
    return {
      complexity: /dashboard|responsive/.test(source) ? "medium" : "low",
      minimum_level: /dashboard|responsive/.test(source) ? "mid" : "junior",
      minimum_skill: "frontend",
      baseHours: /dashboard|responsive/.test(source) ? 16 : 10,
      rationale:
        "Task dominan pada layer frontend sehingga skill frontend menjadi minimum yang paling tepat.",
    };
  }

  if (
    /api|endpoint|backend|database|schema|migration|service|repository|controller/.test(
      source,
    )
  ) {
    return {
      complexity: /migration|database/.test(source) ? "high" : "medium",
      minimum_level: /migration|database/.test(source) ? "senior" : "mid",
      minimum_skill: "backend",
      baseHours: /migration|database/.test(source) ? 22 : 14,
      rationale:
        "Task mengarah ke backend/API sehingga backend adalah skill minimum yang paling aman.",
    };
  }

  if (
    /analysis|requirement|documentation|planning|research|spike/.test(source)
  ) {
    return {
      complexity: "low",
      minimum_level: "junior",
      minimum_skill: "analist",
      baseHours: 8,
      rationale:
        "Task lebih dekat ke analisis kebutuhan atau dokumentasi sehingga analis bisnis adalah minimum yang sesuai.",
    };
  }

  return {
    complexity: "medium",
    minimum_level: "mid",
    minimum_skill: "fullstack",
    baseHours: 14,
    rationale:
      "Task generik software engineering sehingga level mid fullstack dipakai sebagai baseline.",
  };
}

function complexityHours(complexity: "low" | "medium" | "high"): number {
  if (complexity === "low") {
    return 8;
  }

  if (complexity === "medium") {
    return 16;
  }

  return 26;
}

function priorityHours(priority: PriorityLevel): number {
  if (priority === "high") {
    return 6;
  }

  if (priority === "low") {
    return -2;
  }

  return 0;
}

function levelCapacity(level: SprintResource["level"]): number {
  if (level === "senior") {
    return 36;
  }

  if (level === "junior") {
    return 22;
  }

  return 28;
}

function skillCapacity(skill: SprintResource["skill"]): number {
  if (skill === "fullstack") {
    return 1.05;
  }

  if (skill === "devops") {
    return 0.95;
  }

  if (skill === "qa") {
    return 0.9;
  }

  if (skill === "analist") {
    return 0.85;
  }

  return 1;
}

function estimateCapacityHours(input: SprintPlanningInput): number {
  return input.resources.reduce((sum, resource) => {
    return (
      sum +
      resource.quantity *
        levelCapacity(resource.level) *
        skillCapacity(resource.skill) *
        input.sprint_duration_weeks
    );
  }, 0);
}

function summarizeResources(
  resources: SprintPlanningInput["resources"],
): string {
  return resources
    .map(
      (resource) => `${resource.quantity} ${resource.level} ${resource.skill}`,
    )
    .join(", ");
}

function pickDependencies(
  task: SprintTaskInput,
  previousTasks: SprintTaskInput[],
): string[] {
  const source = normalizeSource(task);
  const dependencies: string[] = [];

  for (let index = previousTasks.length - 1; index >= 0; index -= 1) {
    const candidate = previousTasks[index];
    const candidateSource = normalizeSource(candidate);

    if (dependencies.length >= 2) {
      break;
    }

    if (
      /auth|login|permission|role/.test(source) &&
      /api|backend|database|schema/.test(candidateSource)
    ) {
      dependencies.push(candidate.id);
      continue;
    }

    if (
      /frontend|ui|form|page|component/.test(source) &&
      /api|backend|service|controller/.test(candidateSource)
    ) {
      dependencies.push(candidate.id);
      continue;
    }

    if (/test|qa/.test(source) && previousTasks.length > 0) {
      dependencies.push(candidate.id);
      continue;
    }

    if (
      /deploy|docker|kubernetes|ci\/cd|infra/.test(source) &&
      index >= previousTasks.length - 2
    ) {
      dependencies.push(candidate.id);
    }
  }

  return dependencies;
}

function normalizeHours(value: number, minimum = 0): number {
  return clamp(Math.round(value), minimum, 5000);
}

function analyzeSprintTasks(input: SprintPlanningInput) {
  return input.tasks.map((task, index) => {
    const source = normalizeSource(task);
    const family = detectTaskFamily(source);
    const complexityBoost =
      /framework|library|integration|migration|realtime|websocket|multi-tenant|workflow/.test(
        source,
      )
        ? 4
        : /api|backend|frontend|database|auth|payment/.test(source)
          ? 2
          : 0;
    const priorityBoost = priorityHours(task.priority);
    const estimatedHours = normalizeHours(
      family.baseHours +
        complexityHours(family.complexity) +
        complexityBoost +
        priorityBoost,
      1,
    );

    return {
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      complexity: family.complexity,
      minimum_level: family.minimum_level,
      minimum_skill: family.minimum_skill,
      estimated_hours: estimatedHours,
      dependencies: pickDependencies(task, input.tasks.slice(0, index)),
      rationale: family.rationale,
    };
  });
}

export function generateLocalSprintAnalysis(
  input: SprintPlanningInput,
): SprintPlanningOutput {
  const tasks = analyzeSprintTasks(input);
  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + task.estimated_hours,
    0,
  );
  const totalResourceCapacityHours = estimateCapacityHours(input);
  const remainingCapacityHours = Math.max(
    0,
    totalResourceCapacityHours - totalEstimatedHours,
  );

  const fitStatus =
    totalEstimatedHours > totalResourceCapacityHours
      ? "over"
      : totalEstimatedHours >= totalResourceCapacityHours * 0.8
        ? "tight"
        : "fit";

  return {
    sprint_name: input.sprint_name,
    sprint_start_date: input.sprint_start_date,
    sprint_duration_weeks: input.sprint_duration_weeks,
    total_resource_capacity_hours: normalizeHours(totalResourceCapacityHours),
    total_estimated_hours: normalizeHours(totalEstimatedHours, 1),
    remaining_capacity_hours: normalizeHours(remainingCapacityHours),
    fit_status: fitStatus,
    resource_summary: summarizeResources(input.resources),
    sprint_rationale:
      fitStatus === "over"
        ? "Total estimasi task melebihi kapasitas sprint, jadi backlog perlu diprioritaskan atau durasi sprint ditambah."
        : fitStatus === "tight"
          ? "Total estimasi hampir penuh terhadap kapasitas sprint, jadi urutan kerja dan dependency harus dijaga ketat."
          : "Total estimasi masih aman terhadap kapasitas sprint dan siap dipetakan ke Gantt chart.",
    tasks,
  };
}
