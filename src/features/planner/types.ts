export type PriorityLevel = "low" | "medium" | "high";
export type DeveloperLevel = "junior" | "mid" | "senior";
export type RiskLevel = "low" | "medium" | "high";
export type ResourceSkill =
  | "Backend"
  | "Frontend"
  | "System Analyst"
  | "DevOps"
  | "Quality Assurance"
  | "Fullstack";
export type TaskComplexity = "low" | "medium" | "high";

export type SprintResource = {
  level: DeveloperLevel;
  skill: ResourceSkill;
  quantity: number;
};

export type SprintTaskInput = {
  id: string;
  name: string;
  description: string;
  priority: PriorityLevel;
};

export type SprintPlanningInput = {
  sprint_name: string;
  sprint_start_date: string;
  sprint_duration_weeks: number;
  resources: SprintResource[];
  solo_fullstack: boolean;
  fullstack_level: DeveloperLevel;
  tasks: SprintTaskInput[];
};

export type TaskAnalysisOutput = {
  id: string;
  name: string;
  description: string;
  priority: PriorityLevel;
  complexity: TaskComplexity;
  minimum_level: DeveloperLevel;
  minimum_skill: ResourceSkill;
  estimated_hours: number;
  dependencies: string[];
  rationale: string;
};

export type SprintPlanningOutput = {
  sprint_name: string;
  sprint_start_date: string;
  sprint_duration_weeks: number;
  total_resource_capacity_hours: number;
  total_estimated_hours: number;
  remaining_capacity_hours: number;
  fit_status: "fit" | "tight" | "over";
  resource_summary: string;
  sprint_rationale: string;
  tasks: TaskAnalysisOutput[];
};

export type PlannerInput = {
  task_name: string;
  description?: string;
  complexity: number;
  priority: PriorityLevel;
  developer_level: DeveloperLevel;
};

export type SubtaskEstimate = {
  name: string;
  duration_hours: number;
  risk: RiskLevel;
};

export type EstimateOutput = {
  estimated_hours: number;
  risk: RiskLevel;
  breakdown: SubtaskEstimate[];
  rationale: string;
};

export type BreakdownOutput = {
  breakdown: SubtaskEstimate[];
};

export type SprintInput = {
  team_capacity_hours: number;
  sprint_days: number;
  tasks: SubtaskEstimate[];
};

export type SprintOutput = {
  recommended_tasks: Array<{
    name: string;
    duration_hours: number;
  }>;
  total_hours: number;
  remaining_hours: number;
  rationale: string;
};

export type TimelineTask = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string;
  custom_class?: string;
};
