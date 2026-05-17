import { z } from "zod";

const developerLevelSchema = z.enum(["junior", "mid", "senior"]);
const prioritySchema = z.enum(["low", "medium", "high"]);
const resourceSkillSchema = z.enum([
  "backend",
  "frontend",
  "analist",
  "devops",
  "qa",
  "fullstack",
]);

export const SprintResourceSchema = z.object({
  level: developerLevelSchema,
  skill: resourceSkillSchema,
  quantity: z.number().int().min(1).max(100),
});

export const SprintTaskInputSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(1200),
  priority: prioritySchema,
});

export const SprintPlanningInputSchema = z.object({
  sprint_name: z.string().trim().min(3).max(120),
  sprint_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sprint_duration_weeks: z.number().int().min(1).max(52),
  resources: z.array(SprintResourceSchema).min(1).max(20),
  solo_fullstack: z.boolean(),
  fullstack_level: developerLevelSchema,
  tasks: z.array(SprintTaskInputSchema).min(1).max(30),
  include_weekends: z.boolean(),
  holiday_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(20),
});

export const PlannerInputSchema = z.object({
  task_name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  complexity: z.number().int().min(1).max(10),
  priority: prioritySchema,
  developer_level: developerLevelSchema,
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

export const TaskAnalysisOutputSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(1200),
  priority: prioritySchema,
  complexity: z.enum(["low", "medium", "high"]),
  minimum_level: developerLevelSchema,
  minimum_skill: resourceSkillSchema,
  estimated_hours: z.number().int().min(1).max(240),
  dependencies: z.array(z.string().trim().min(1).max(40)).max(20),
  rationale: z.string().trim().min(10).max(400),
});

export const SprintPlanningOutputSchema = z.object({
  sprint_name: z.string().trim().min(3).max(120),
  sprint_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sprint_duration_weeks: z.number().int().min(1).max(52),
  total_resource_capacity_hours: z.number().int().min(0).max(5000),
  total_estimated_hours: z.number().int().min(0).max(5000),
  remaining_capacity_hours: z.number().int().min(0).max(5000),
  fit_status: z.enum(["fit", "tight", "over"]),
  resource_summary: z.string().trim().min(10).max(500),
  sprint_rationale: z.string().trim().min(10).max(800),
  tasks: z.array(TaskAnalysisOutputSchema).min(1).max(30),
});
