export type PriorityLevel = "low" | "medium" | "high";
export type DeveloperLevel = "junior" | "mid" | "senior";
export type RiskLevel = "low" | "medium" | "high";

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
