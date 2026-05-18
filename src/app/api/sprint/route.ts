import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildSprintPlanningPrompt } from "@/features/planner/prompts";
import {
  SprintPlanningInputSchema,
  SprintPlanningOutputSchema,
} from "@/features/planner/schemas";
import type { SprintPlanningInput, SprintPlanningOutput } from "@/features/planner/types";
import { generateGeminiJson } from "@/lib/ai";

export const runtime = "nodejs";

function formatValidationError(error: ZodError): string {
  const issue = error.issues[0];

  if (!issue) {
    return "Input sprint tidak valid.";
  }

  const pathLabel = issue.path
    .map((segment) => (typeof segment === "number" ? String(segment + 1) : String(segment)))
    .join(".");

  if (pathLabel.length === 0) {
    return issue.message;
  }

  return `${pathLabel}: ${issue.message}`;
}

function enforceUserTasksOnly(
  input: SprintPlanningInput,
  output: SprintPlanningOutput,
): SprintPlanningOutput {
  const inputTaskById = new Map(input.tasks.map((task) => [task.id, task]));
  const allowedTaskIds = new Set(input.tasks.map((task) => task.id));
  const aiTaskById = new Map(output.tasks.map((task) => [task.id, task]));

  const tasks = input.tasks.map((sourceTask) => {
    const aiTask = aiTaskById.get(sourceTask.id);

    if (!aiTask) {
      return {
        id: sourceTask.id,
        name: sourceTask.name,
        description: sourceTask.description,
        priority: sourceTask.priority,
        complexity: "medium" as const,
        minimum_level: "mid" as const,
        minimum_skill: "fullstack" as const,
        estimated_hours: 8,
        dependencies: [],
        rationale:
          "Task ini tetap dipertahankan dari input user karena tidak ada analisis AI untuk id tersebut.",
      };
    }

    return {
      ...aiTask,
      name: inputTaskById.get(sourceTask.id)?.name ?? aiTask.name,
      description:
        inputTaskById.get(sourceTask.id)?.description ?? aiTask.description,
      priority: inputTaskById.get(sourceTask.id)?.priority ?? aiTask.priority,
      dependencies: aiTask.dependencies.filter(
        (dependencyId) =>
          allowedTaskIds.has(dependencyId) && dependencyId !== sourceTask.id,
      ),
    };
  });

  return {
    ...output,
    tasks,
  };
}

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown;
    const input = SprintPlanningInputSchema.parse(json);

    try {
      const prompt = buildSprintPlanningPrompt(input);
      const sprintPlan = await generateGeminiJson(
        prompt,
        SprintPlanningOutputSchema,
      );
      return NextResponse.json(enforceUserTasksOnly(input, sprintPlan));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan pada sprint planning.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: formatValidationError(error) },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan pada sprint planning.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
