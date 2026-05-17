import { NextResponse } from "next/server";

import { generateLocalEstimate } from "@/features/planner/fallback";
import { buildEstimatePrompt } from "@/features/planner/prompts";
import { EstimateOutputSchema, PlannerInputSchema } from "@/features/planner/schemas";
import { generateGeminiJson, shouldUseLocalFallback } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const json = (await request.json()) as unknown;
        const input = PlannerInputSchema.parse(json);

        try {
            const prompt = buildEstimatePrompt(input);
            const estimate = await generateGeminiJson(prompt, EstimateOutputSchema);
            return NextResponse.json(estimate);
        } catch (error) {
            if (shouldUseLocalFallback(error)) {
                return NextResponse.json(generateLocalEstimate(input));
            }
            throw error;
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan pada estimator.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
