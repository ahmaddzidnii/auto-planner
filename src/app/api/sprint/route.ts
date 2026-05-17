import { NextResponse } from "next/server";

import { generateLocalSprintAnalysis } from "@/features/planner/fallback";
import { buildSprintPlanningPrompt } from "@/features/planner/prompts";
import {
  SprintPlanningInputSchema,
  SprintPlanningOutputSchema,
} from "@/features/planner/schemas";
import { generateGeminiJson, shouldUseLocalFallback } from "@/lib/ai";

export const runtime = "nodejs";

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
      return NextResponse.json(sprintPlan);
    } catch (error) {
      if (shouldUseLocalFallback(error)) {
        return NextResponse.json(generateLocalSprintAnalysis(input));
      }
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan pada sprint planning.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
