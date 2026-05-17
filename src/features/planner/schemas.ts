import { z } from "zod";

export const PlannerInputSchema = z.object({
    task_name: z.string().trim().min(3).max(120),
    description: z.string().trim().max(500).optional(),
    complexity: z.number().int().min(1).max(10),
    priority: z.enum(["low", "medium", "high"]),
    developer_level: z.enum(["junior", "mid", "senior"]),
});

export const SubtaskEstimateSchema = z.object({
    name: z.string().trim().min(2).max(120),
    duration_hours: z.number().int().min(1).max(120),
    risk: z.enum(["low", "medium", "high"]),
});

export const EstimateOutputSchema = z.object({
    estimated_hours: z.number().int().min(1).max(500),
    risk: z.enum(["low", "medium", "high"]),
    breakdown: z.array(SubtaskEstimateSchema).min(1).max(20),
    rationale: z.string().trim().min(10).max(500),
});

export const BreakdownOutputSchema = z.object({
    breakdown: z.array(SubtaskEstimateSchema).min(1).max(20),
});

export const SprintInputSchema = z.object({
    team_capacity_hours: z.number().int().min(1).max(1000),
    sprint_days: z.number().int().min(1).max(30).default(7),
    tasks: z.array(SubtaskEstimateSchema).min(1),
});

export const SprintOutputSchema = z.object({
    recommended_tasks: z.array(
        z.object({
            name: z.string().trim().min(2).max(120),
            duration_hours: z.number().int().min(1).max(120),
        }),
    ),
    total_hours: z.number().int().min(0),
    remaining_hours: z.number().int().min(0),
    rationale: z.string().trim().min(10).max(500),
});
