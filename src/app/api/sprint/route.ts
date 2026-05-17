import { NextResponse } from "next/server";

import { generateLocalSprintPlan } from "@/features/planner/fallback";
import { buildSprintPrompt } from "@/features/planner/prompts";
import { SprintInputSchema, SprintOutputSchema } from "@/features/planner/schemas";
import { generateGeminiJson, shouldUseLocalFallback } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const json = (await request.json()) as unknown;
        const input = SprintInputSchema.parse(json);

        try {
            const prompt = buildSprintPrompt(input.tasks, input.team_capacity_hours, input.sprint_days);
            const sprintPlan = await generateGeminiJson(prompt, SprintOutputSchema);
            return NextResponse.json(sprintPlan);
        } catch (error) {
            if (shouldUseLocalFallback(error)) {
                return NextResponse.json(generateLocalSprintPlan(input.tasks, input.team_capacity_hours));
            }
            throw error;
        }
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Terjadi kesalahan pada sprint recommendation.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
